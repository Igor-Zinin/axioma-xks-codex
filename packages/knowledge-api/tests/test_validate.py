"""Проверка валидатора с �
�беих сторон.

Каждое пра�
�ило проверяется дважды: 
сломать поле — валидато�
� обязан покраснеть
с вня
тным сообщением, вернуть
 — позеленеть. Правило, у
 которого проверен
тольк
о зелёный путь, не доказа
но: оно могло бы молча пр�
�пускать всё подряд.

Зап�
�ск: python tests/test_validate.py
"""

imp
ort copy
import json
import sys
from pathlib 
import Path

sys.path.insert(0, str(Path(__fi
le__).parent.parent))

from validate import (
  # noqa: E402
    Report, check_node, check_
graph, find_capsules, validate_graph_file, BA
SE_DIR,
)

FIXTURES = Path(__file__).parent /
 "fixtures"

# Эталонный узел: �
�роходит все проверки. От
 него отталкиваются все �
�оломки.
GOOD = {
    "xks_version": "1
.0",
    "id": "Math",
    "title": "Мате
матика",
    "version": "1.0.0",
    "l
ifecycle": "observed",
    "kind": "disciplin
e",
    "updated": "2026-08-02",
    "qids": 
["Q395"],
    "provenance": {"title": {"sourc
e": "wikidata:Q395", "timestamp": "2026-08-02
"}},
    "decay": {"trigger": "смена н�
�звания дисциплины", "check_a
fter": "2027-08"},
    "evidence": [{"ref": "
README.md", "status": "verified", "timestamp"
: "2026-08-02"}],
}

passed = failed = 0


de
f check(title, condition, detail=""):
    glo
bal passed, failed
    if condition:
        
passed += 1
        print(f"  ✅ {title}")
 
   else:
        failed += 1
        print(f"
  ❌ {title}{(' — ' + detail) if detail el
se ''}")


def errors_for(node, **graph_extra
):
    """Прогоняет один узе�
� через валидатор и возвр
ащает список нарушений.""
"
    report = Report()
    graph = {"nodes":
 [node], "links": []}
    graph.update(graph_
extra)
    check_graph(graph, report)
    ret
urn report.errors


def both_ways(title, muta
te, expect_substring):
    """Ломает п
оле, ждёт красного с внят
ным текстом, возвращает �
�� ждёт зелёного."""
    broken =
 copy.deepcopy(GOOD)
    mutate(broken)

    
errs = errors_for(broken)
    hit = [e for e 
in errs if expect_substring in e]
    check(f
"{title} — краснеет", bool(hit), f"
ожидал «{expect_substring}», полу
чил {errs or 'ничего'}")
    if hit:

        check(f"{title} — сообщени
е внятное", len(hit[0]) > len(expect_
substring) + 5, hit[0])

    restored = copy.
deepcopy(GOOD)
    check(f"{title} — зел
енеет обратно", not errors_for(re
stored), str(errors_for(restored)))


print("
\n=== Эталон ===")
check("чистый 
узел проходит", not errors_for(co
py.deepcopy(GOOD)), str(errors_for(copy.deepc
opy(GOOD))))

print("\n=== Обязатель
ные поля ===")
for field in ("xks_vers
ion", "id", "title", "version", "lifecycle", 
"kind", "updated"):
    both_ways(f'нет п
оля "{field}"', lambda n, f=field: n.pop(f
), f'обязательное поле "{fiel
d}"')

both_ways("поле пустой ст�
�окой", lambda n: n.update(title="   "), 
'обязательное поле "title"')


print("\n=== Значения из слов�
�рей ===")
both_ways("чужой xks_versi
on", lambda n: n.update(xks_version="2.0"), "
известна только версия ф
ормата 1.0")
both_ways("чужой life
cycle", lambda n: n.update(lifecycle="growing
"), "lifecycle=\"growing\"")
both_ways("чу�
�ой kind", lambda n: n.update(kind="project
"), "kind=\"project\"")
both_ways("не-semve
r version", lambda n: n.update(version="1.0")
, "ожидается semver")
both_ways("к�
�ивая дата", lambda n: n.update(updat
ed="02.08.2026"), "ожидается дат�
�")
both_ways("кривой id", lambda n: n.
update(id="2-математика"), "доп�
�стимы буквы")

print("\n=== Наш
е расширение: historical ===")
ok_
hist = copy.deepcopy(GOOD)
ok_hist["lifecycle
"] = "historical"
check("historical прин�
�мается (решение №30)", not er
rors_for(ok_hist), str(errors_for(ok_hist)))


print("\n=== Якоря Wikidata и Желе
зное правило ===")
both_ways("му
сор вместо QID", lambda n: n.update(
qids=["Математика"]), "ожидае
тся идентификатор вида Q1
23")
both_ways("пустой qids без об
основания", lambda n: n.update(qids=
[], qid_note=""), "не заполнен qid_
note")

ok_empty = copy.deepcopy(GOOD)
ok_emp
ty.update(qids=[], qid_note="Авторски
й узел, соответствия в Wiki
data нет")
check("пустой qids с о�
�основанием проходит", not 
errors_for(ok_empty), str(errors_for(ok_empty
)))

print("\n=== Provenance-штамп ===")

both_ways("provenance без source",
      
    lambda n: n.update(provenance={"title": {
"timestamp": "2026-08-02"}}),
          'бе
з "source"')
both_ways("provenance без ti
mestamp",
          lambda n: n.update(proven
ance={"title": {"source": "wikidata"}}),
    
      'без "timestamp"')

print("\n=== Д�
�казательства и протухан
ие ===")
both_ways("evidence на несу�
�ествующий путь",
          lamb
da n: n.update(evidence=[{"ref": "нет-та
кого-файла.md"}]),
          "не �
�уществует на диске")
both_wa
ys("decay без check_after",
          lamb
da n: n.update(decay={"trigger": "что-то
"}),
          'decay без "check_after"')


print("\n=== Целостность граф
а ===")
dup = {"nodes": [copy.deepcopy(GOOD)
, copy.deepcopy(GOOD)], "links": []}
rep = Re
port(); check_graph(dup, rep)
check("дубл
ь id краснеет", any("больше о
дного раза" in e for e in rep.errors
), str(rep.errors))

dangling = {"nodes": [co
py.deepcopy(GOOD)], "links": [{"source": "Mat
h", "target": "Нет", "type": "is_part_of"}
]}
rep = Report(); check_graph(dangling, rep)

check("связь в никуда красн
еет", any("не существует" in e
 for e in rep.errors), str(rep.errors))

bad_
parent = copy.deepcopy(GOOD); bad_parent["par
ent"] = "Призрак"
check("parent на �
�есуществующий узел крас
неет",
      any('parent="Призрак"
' in e for e in errors_for(bad_parent)), str(
errors_for(bad_parent)))

print("\n=== Аци
кличность порядка обход�
� ===")
a = copy.deepcopy(GOOD); a["id"] = "A
"
b = copy.deepcopy(GOOD); b["id"] = "B"
cyc 
= {"nodes": [a, b], "links": [
    {"source":
 "A", "target": "B", "type": "prerequisite"},

    {"source": "B", "target": "A", "type": "
prerequisite"},
]}
rep = Report(); check_grap
h(cyc, rep)
check("цикл prerequisite кр
аснеет", any("цикл в prerequisite"
 in e for e in rep.errors), str(rep.errors))


acyc = {"nodes": [a, b], "links": [{"source"
: "A", "target": "B", "type": "prerequisite"}
]}
rep = Report(); check_graph(acyc, rep)
che
ck("прямая цепочка проход�
�т", rep.ok, str(rep.errors))

print("\n=== 
Фикстуры не попадают в с�
�анер ===")
FIXTURES.mkdir(parents=True, 
exist_ok=True)
broken = FIXTURES / "broken.xk
s.json"
broken.write_text(json.dumps({"id": "
СЛОМАНО"}, ensure_ascii=False), encodi
ng="utf-8")
scanned = [p.as_posix() for p in 
find_capsules()]
check("заведомо би
тая фикстура не подхваче
на сканером",
      not any("tests/
fixtures" in p for p in scanned), str(scanned
))

print("\n=== Живой граф прое
кта ===")
live = validate_graph_file()
che
ck("humanity_knowledge_graph.json прохо�
�ит", live.ok,
      f"{len(live.errors)} �
�арушений, первые: {live.errors
[:3]}")

print(f"\n{'✅' if failed == 0 else
 '❌'} Проверок: {passed + failed}, 
провалов: {failed}\n")
sys.exit(0 if 
failed == 0 else 1)


