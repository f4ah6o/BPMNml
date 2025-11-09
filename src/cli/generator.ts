import { BPMN, Event, Task, Gateway, Pool, Lane, Connection } from '../generated/ast.ts';

export interface BPMNXMLOptions {
    prettify?: boolean;
}

/**
 * Generates BPMN 2.0 XML from BPMNml AST
 */
export class BPMNXMLGenerator {
    private idCounter = 0;
    private idMap = new Map<string, string>();

    generateXML(model: BPMN, options: BPMNXMLOptions = {}): string {
        this.idCounter = 0;
        this.idMap.clear();

        const elements: string[] = [];
        const flows: string[] = [];

        // Process all elements
        for (const element of model.elements) {
            if (element.$type === 'Event') {
                elements.push(this.generateEvent(element as Event));
            } else if (element.$type === 'Task') {
                elements.push(this.generateTask(element as Task));
            } else if (element.$type === 'Gateway') {
                elements.push(this.generateGateway(element as Gateway));
            } else if (element.$type === 'Connection') {
                flows.push(this.generateSequenceFlow(element as Connection));
            } else if (element.$type === 'Pool') {
                elements.push(this.generatePool(element as Pool, flows));
            }
        }

        const processId = 'Process_1';
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
             xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
             id="Definitions_1"
             targetNamespace="http://bpmn.io/schema/bpmn">
  <process id="${processId}" isExecutable="false">
${elements.map(e => '    ' + e).join('\n')}
${flows.map(f => '    ' + f).join('\n')}
  </process>
</definitions>`;

        return xml;
    }

    private generateId(name: string): string {
        if (!this.idMap.has(name)) {
            this.idCounter++;
            this.idMap.set(name, `${name}_${this.idCounter}`);
        }
        return this.idMap.get(name)!;
    }

    private generateEvent(event: Event): string {
        const id = this.generateId(event.name);
        const eventType = event.eventType || 'intermediate';

        if (eventType === 'start') {
            return `<startEvent id="${id}" name="${event.name}" />`;
        } else if (eventType === 'end') {
            return `<endEvent id="${id}" name="${event.name}" />`;
        } else {
            return `<intermediateThrowEvent id="${id}" name="${event.name}" />`;
        }
    }

    private generateTask(task: Task): string {
        const id = this.generateId(task.name);
        const taskType = task.taskType || 'task';

        switch (taskType) {
            case 'user':
                return `<userTask id="${id}" name="${task.name}" />`;
            case 'service':
                return `<serviceTask id="${id}" name="${task.name}" />`;
            case 'manual':
                return `<manualTask id="${id}" name="${task.name}" />`;
            case 'script':
                return `<scriptTask id="${id}" name="${task.name}" />`;
            case 'send':
                return `<sendTask id="${id}" name="${task.name}" />`;
            case 'receive':
                return `<receiveTask id="${id}" name="${task.name}" />`;
            case 'business-rule':
                return `<businessRuleTask id="${id}" name="${task.name}" />`;
            default:
                return `<task id="${id}" name="${task.name}" />`;
        }
    }

    private generateGateway(gateway: Gateway): string {
        const id = this.generateId(gateway.name);
        const gatewayType = gateway.gatewayType || 'exclusive';

        switch (gatewayType) {
            case 'exclusive':
                return `<exclusiveGateway id="${id}" name="${gateway.name}" />`;
            case 'parallel':
                return `<parallelGateway id="${id}" name="${gateway.name}" />`;
            case 'inclusive':
                return `<inclusiveGateway id="${id}" name="${gateway.name}" />`;
            case 'event-based':
                return `<eventBasedGateway id="${id}" name="${gateway.name}" />`;
            case 'complex':
                return `<complexGateway id="${id}" name="${gateway.name}" />`;
            default:
                return `<exclusiveGateway id="${id}" name="${gateway.name}" />`;
        }
    }

    private generateSequenceFlow(connection: Connection): string {
        const flowId = `Flow_${this.idCounter++}`;
        const sourceId = this.generateId(connection.source.ref!.name);
        const targetId = this.generateId(connection.target.ref!.name);
        const label = connection.label || '';

        if (label) {
            return `<sequenceFlow id="${flowId}" sourceRef="${sourceId}" targetRef="${targetId}" name="${label}" />`;
        } else {
            return `<sequenceFlow id="${flowId}" sourceRef="${sourceId}" targetRef="${targetId}" />`;
        }
    }

    private generatePool(pool: Pool, flows: string[]): string {
        // Simplified pool generation - full implementation would include lanes and collaboration
        return `<!-- Pool: ${pool.name} -->`;
    }
}
