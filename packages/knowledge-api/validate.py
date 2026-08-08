"""Валидатор схемы капсул
 онтологии.

Схема адапти
рована из XKS Contract v1 (сосед
ний проект, ветка
`fix/xks-cano
n-and-doctor`): канон схемы — XKS
_CONTRACT_V1.md, канон смысла —

FORMAT.md; где они расходятся
 в схеме, прав Контракт, п
отому что он исполняем.

�
�равило, ради которого эт
от файл написан раньше м�
�грации:
**правило без про
верки — не правило, а пож
елание.** В соседнем прое�
�те
версионный контракт �
�уществовал с самого нач�
�ла, не проверялся и выро�
�ился —
поля не было в 12 к
апсулах из 23. Новое требо
вание к схеме вводится в�
�есте
со строкой здесь ил
и не вводится вовсе.

Зап�
�ск:  python validate.py
Выход:   0 �
� чисто, 1 — есть нарушени
я.
"""

import json
import re
import sys
fro
m datetime import date
from pathlib import Pa
th

BASE_DIR = Path(__file__).parent.resolve(
)
GRAPH_FILE = BASE_DIR / "humanity_knowledge
_graph.json"

# Папки, которые с
канер обходит стороной. �
�естовые фикстуры содерж
ат
# заведомо битые капсу
лы: если их подхватить, в�
�лидатор станет красным
#
 всегда и перестанет что-
либо значить.
IGNORE_DIRS = {".git
", "__pycache__", "node_modules", ".claude", 
"tests"}

# --- Схема ------------------
---------------------------------------------
--

# Семь обязательных по�
�ей. `layer` из XKS не взят: там
 это core/face/vault —
# деление 
кодовой базы, у нас модул
ей кода нет (решение №32 з
а Оператором).
REQUIRED_FIELDS = (
"xks_version", "id", "title", "version", "lif
ecycle", "kind", "updated")

VALID_XKS_VERSIO
N = {"1.0"}

# Семь состояний: �
�есть из Контракта плюс `h
istorical` — наше осознанное

# расширение (решение №30)
. Снятая с публикации тем
а остаётся читаемой.
VALID_L
IFECYCLE = {
    "draft", "observed", "verifi
ed", "replicated",
    "consensus", "deprecat
ed", "historical",
}

# Свой словар
ь вместо project/knowledge/example/tem
plate: у нас узлы карты
# зна
ний, а не модули репозито
рия.
VALID_KIND = {"hub", "discipline", "p
erson", "work", "corpus"}

ID_RE = re.compile
(r"^[A-Za-z][A-Za-z0-9_]*$")
QID_RE = re.comp
ile(r"^Q\d+$")
SEMVER_RE = re.compile(r"^\d+\
.\d+\.\d+$")
ISO_DATE_RE = re.compile(r"^\d{4
}-\d{2}-\d{2}$")


class Report:
    """Со�
�ирает нарушения, чтобы п
оказать все сразу, а не п�
�рвое попавшееся."""

    def _
_init__(self):
        self.errors = []

    
def fail(self, where, message):
        self.
errors.append(f"{where}: {message}")

    @pr
operty
    def ok(self):
        return not s
elf.errors


# --- Проверки узла 
---------------------------------------------
------------

def check_node(node, report, kn
own_ids=None):
    where = node.get("id") or 
"<узел без id>"

    for field in REQU
IRED_FIELDS:
        value = node.get(field)

        if value is None or (isinstance(value
, str) and not value.strip()):
            re
port.fail(where, f'отсутствует о�
�язательное поле "{field}"')

 
   if "xks_version" in node and node["xks_ver
sion"] not in VALID_XKS_VERSION:
        repo
rt.fail(where, f'xks_version="{node["xks_vers
ion"]}" — известна только в�
�рсия формата 1.0')

    if "lifec
ycle" in node and node["lifecycle"] not in VA
LID_LIFECYCLE:
        report.fail(where, f'l
ifecycle="{node["lifecycle"]}" не вход�
�т в {sorted(VALID_LIFECYCLE)}')

    if "k
ind" in node and node["kind"] not in VALID_KI
ND:
        report.fail(where, f'kind="{node[
"kind"]}" не входит в {sorted(VALID_
KIND)}')

    if isinstance(node.get("id"), s
tr) and not ID_RE.match(node["id"]):
        
report.fail(where, f'id="{node["id"]}" — д
опустимы буквы, цифры и п
одчёркивание, начиная с �
�уквы')

    if isinstance(node.get("vers
ion"), str) and not SEMVER_RE.match(node["ver
sion"]):
        report.fail(where, f'version
="{node["version"]}" — ожидается s
emver вида 1.0.0')

    if isinstance(nod
e.get("updated"), str) and not ISO_DATE_RE.ma
tch(node["updated"]):
        report.fail(whe
re, f'updated="{node["updated"]}" — ожи�
�ается дата вида ГГГГ-ММ-�
�Д')

    # Якоря Wikidata
    qids = n
ode.get("qids")
    if qids is not None:
    
    if not isinstance(qids, list):
          
  report.fail(where, "qids должно бы�
�ь массивом")
        else:
        
    for q in qids:
                if not (is
instance(q, str) and QID_RE.match(q)):
      
              report.fail(where, f'qids со�
�ержит "{q}" — ожидается ид
ентификатор вида Q123')
      
      # Железное правило в н
ашей редакции: заявка бе�
� доказательства
            # 
обязана быть явной. Пуст�
�й массив без объяснения 
— молчаливый
            # про
пуск, который со времене�
� читается как «просто не
 заполнили».
            if not qid
s and not str(node.get("qid_note", "")).strip
():
                report.fail(where, "qids 
пуст, но не заполнен qid_note
 с обоснованием")

    # Provena
nce-штамп: значение без ис�
�очника и даты — заявлен�
�е без доказательства
    p
rov = node.get("provenance")
    if prov is n
ot None:
        if not isinstance(prov, dict
):
            report.fail(where, "provenance
 должно быть объектом {по
ле: {source, timestamp}}")
        else:
  
          for field, stamp in prov.items():
 
               if not isinstance(stamp, dict)
:
                    report.fail(where, f'pr
ovenance["{field}"] должно быть о�
�ъектом')
                    continue

                for req in ("source", "timest
amp"):
                    if not str(stamp.g
et(req, "")).strip():
                       
 report.fail(where, f'provenance["{field}"] �
�ез "{req}" — заявление без �
�оказательства')

    # Дока
зательства: путь, указан�
�ый в ref, обязан существов
ать
    for item in node.get("evidence", [
]) or []:
        if not isinstance(item, dic
t):
            report.fail(where, "элем�
�нт evidence должен быть объе
ктом")
            continue
        ref =
 str(item.get("ref", "")).strip()
        if 
not ref:
            report.fail(where, "эл
емент evidence без ref")
            
continue
        if not re.match(r"^\w+://", 
ref):  # не URL — считаем путё
м
            if not (BASE_DIR / ref).exists
():
                report.fail(where, f'evid
ence.ref "{ref}" не существует н
а диске')

    # Increase decay: пом
етка о протухании должна
 быть полной
    decay = node.get("
decay")
    if decay is not None:
        if 
not isinstance(decay, dict):
            repo
rt.fail(where, "decay должно быть �
�бъектом {trigger, check_after}")
    
    else:
            for req in ("trigger", 
"check_after"):
                if not str(de
cay.get(req, "")).strip():
                  
  report.fail(where, f'decay без "{req}" �
�� непонятно, что и когда �
�ерепроверять')

    # Identity-�
�лой: ссылки обязаны вест
и на существующие узлы
   
 if known_ids is not None:
        parent = n
ode.get("parent")
        if parent and paren
t not in known_ids:
            report.fail(w
here, f'parent="{parent}" — такого у
зла нет')
        for link in node.get(
"links", []) or []:
            if link not i
n known_ids:
                report.fail(wher
e, f'links содержит "{link}" — та
кого узла нет')


# --- Прове
рки графа ---------------------------
-----------------------------

def check_grap
h(graph, report):
    nodes = graph.get("node
s", [])
    links = graph.get("links", [])

 
   ids = [n.get("id") for n in nodes]
    kno
wn = set(ids)

    seen = set()
    for i in 
ids:
        if i in seen:
            report
.fail("граф", f'идентификато�
� "{i}" встречается больше �
�дного раза')
        seen.add(i)

 
   for node in nodes:
        check_node(node
, report, known_ids=known)

    for link in l
inks:
        for end in ("source", "target")
:
            ref = link.get(end)
           
 if ref not in known:
                report.
fail("граф", f'связь {link.get("sour
ce")}→{link.get("target")}: {end}="{ref}" �
�е существует')

    # Поряд�
�к обхода обязан быть аци
клическим, иначе маршрут
 обучения
    # зациклится.
 Проверяем заранее, до по
явления самих связей.
    p
rereq = {}
    for link in links:
        if 
link.get("type") == "prerequisite":
         
   prereq.setdefault(link["source"], []).appe
nd(link["target"])

    WHITE, GREY, BLACK = 
0, 1, 2
    color = {i: WHITE for i in known}


    def visit(node_id, path):
        color
[node_id] = GREY
        for nxt in prereq.ge
t(node_id, []):
            if color.get(nxt)
 == GREY:
                cycle = " → ".joi
n(path + [nxt])
                report.fail("
граф", f"цикл в prerequisite: {cycle
}")
            elif color.get(nxt) == WHITE:

                visit(nxt, path + [nxt])
   
     color[node_id] = BLACK

    for node_id 
in list(prereq):
        if color.get(node_id
) == WHITE:
            visit(node_id, [node_
id])


# --- Точка входа ----------
---------------------------------------------
----

def find_capsules(root=BASE_DIR):
    "
""Отдельные капсулы `*.xks.js
on` в репозитории.

    Папк�
� из IGNORE_DIRS не обходятся: �
� `tests/` лежат заведомо бит
ые
    фикстуры, и если ска
нер их подхватит, валида�
�ор станет красным всегд�
�.
    Красный тест, завися�
�ий от того, что рядом леж
ит, читается как шум.
    """

    found = []
    for path in sorted(Path(r
oot).rglob("*.xks.json")):
        if any(par
t in IGNORE_DIRS for part in path.relative_to
(root).parts[:-1]):
            continue
    
    found.append(path)
    return found


def
 validate_capsule_files(root=BASE_DIR, report
=None):
    report = report or Report()
    f
or path in find_capsules(root):
        rel =
 path.relative_to(root).as_posix()
        tr
y:
            node = json.loads(path.read_te
xt(encoding="utf-8"))
        except Exceptio
n as e:
            report.fail(rel, f"не �
�азбирается как JSON ({e})")
   
         continue
        check_node(node, re
port)
    return report


def validate_graph_
file(path=GRAPH_FILE):
    report = Report()

    try:
        graph = json.loads(Path(path
).read_text(encoding="utf-8"))
    except Exc
eption as e:
        report.fail(str(path), f
"не разбирается как JSON ({e}
)")
        return report
    check_graph(gra
ph, report)
    return report


def main():
 
   print(f"\nПроверяю {GRAPH_FILE.nam
e} по схеме капсулы v1 (xks_ver
sion 1.0)\n")
    report = validate_graph_fil
e()
    validate_capsule_files(report=report)


    graph = json.loads(GRAPH_FILE.read_text
(encoding="utf-8")) if GRAPH_FILE.exists() el
se {"nodes": []}
    total = len(graph.get("n
odes", []))
    capsules = len(find_capsules(
))

    for line in report.errors:
        pr
int(f"  ❌ {line}")

    tail = f"Узлов
 проверено: {total}, отдельн�
�х капсул: {capsules}"
    if report.o
k:
        print(f"✅ {tail}, нарушен
ий: 0\n")
        return 0
    print(f"\n�
� {tail}, нарушений: {len(report.err
ors)}\n")
    return 1


if __name__ == "__ma
in__":
    sys.exit(main())


