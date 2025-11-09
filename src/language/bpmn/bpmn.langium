grammar BPMNml

// Import common grammar elements
import "../common/common";

// Entry rule
entry BPMN returns BPMN:
    NEWLINE*
    "bpmn-beta"
    (
        NEWLINE* TitleAndAccessibilities elements+=BPMNElement*
        | NEWLINE* elements+=BPMNElement+
        | NEWLINE*
    )
;

interface BPMN extends Common {
    elements: BPMNElement[];
}

// Definition of BPMN elements
BPMNElement:
    Node | Container | Connection;

// Abstract definition of a node
Node:
    Event | Task | Gateway;

// Definition of an event
Event:
    NEWLINE* 'event' name=ID ('<<' eventType=('start' | 'end' | 'intermediate' | 'message' | 'timer' | 'error' | 'escalation' | 'cancel' | 'compensation' | 'conditional' | 'link' | 'signal' | 'terminate' | 'multiple' | 'parallel') '>>')? NEWLINE*
;

// Definition of a task
Task:
    NEWLINE* 'task' name=ID ('<<' taskType=('service' | 'user' | 'manual' | 'send' | 'receive' | 'script' | 'business-rule') '>>')? NEWLINE*
;

// Definition of a gateway
Gateway:
    NEWLINE* 'gateway' name=ID ('<<' gatewayType=('exclusive' | 'parallel' | 'inclusive' | 'event-based' | 'complex') '>>')? NEWLINE*
;

// Abstract definition of a container
Container:
    Pool | Lane;

// Definition of a pool
Pool:
    NEWLINE* 'pool' name=ID '{' NEWLINE*
        elements+=BPMNElement*
    NEWLINE* '}' NEWLINE*
;

// Definition of a lane
Lane:
    NEWLINE* 'lane' name=ID '{' NEWLINE*
        elements+=BPMNElement*
    NEWLINE* '}' NEWLINE*
;

// Definition of a connection
Connection:
    NEWLINE* source=[Node:ID] connector=('-->' | '..->' | '--' | '..' | '==>' | '~~>') target=[Node:ID] (':' label=STRING)? NEWLINE*
;

// Terminal definitions
terminal ID: /[a-zA-Z_][a-zA-Z0-9_]*/;
terminal STRING: /"([^"\\]|\\.)*"/ | /'([^'\\]|\\.)*'/;

hidden terminal WS: /[ \t]+/;
