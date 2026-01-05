import type { BPMN, Event, Task, Gateway, Pool, Lane, Connection, Node } from '../generated/ast.js';

export interface BPMNXMLOptions {
    prettify?: boolean;
}

type ProcessContent = {
    elements: string[];
    flows: string[];
    messageFlows: string[];
    sequenceFlows: Connection[];
    associationFlows: Connection[];
    messageFlowConnections: Connection[];
};

type NodeBounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type ProcessSpec = {
    id: string;
    nodes: Node[];
    content: ProcessContent;
    pool?: Pool;
};

type ParticipantSpec = {
    id: string;
    xml: string;
    pool: Pool;
};

/**
 * Generates BPMN 2.0 XML from BPMNml AST
 */
export class BPMNXMLGenerator {
    private idCounter = 0;
    private nameCounts = new Map<string, number>();
    private nodeIdMap = new WeakMap<Node, string>();
    private connectionIdMap = new WeakMap<Connection, string>();

    generateXML(model: BPMN, options: BPMNXMLOptions = {}): string {
        this.resetIds();

        const globalNodes: Node[] = [];
        const globalConnections: Connection[] = [];
        const pools: Pool[] = [];

        for (const element of model.elements) {
            if (this.isNode(element)) {
                globalNodes.push(element as Node);
            } else if (element.$type === 'Connection') {
                globalConnections.push(element as Connection);
            } else if (element.$type === 'Pool') {
                pools.push(element as Pool);
            }
        }

        const processes: string[] = [];
        const participants: ParticipantSpec[] = [];
        const messageFlows: string[] = [];
        const processSpecs: ProcessSpec[] = [];
        const messageFlowConnections: Connection[] = [];

        const hasGlobalFlowContent = globalNodes.length > 0
            || globalConnections.some((connection) => !this.isMessageFlow(connection));

        if (hasGlobalFlowContent || pools.length === 0) {
            const content = this.generateProcessContent(globalNodes, globalConnections);
            const processId = this.nextId('Process');
            processes.push(this.renderProcess(processId, content));
            messageFlows.push(...content.messageFlows);
            messageFlowConnections.push(...content.messageFlowConnections);
            processSpecs.push({ id: processId, nodes: globalNodes, content });
        }

        for (const pool of pools) {
            const { nodes, connections } = this.collectContainerElements(pool);
            const content = this.generateProcessContent(nodes, connections);
            const processId = this.nextId(`Process_${pool.name}`);
            processes.push(this.renderProcess(processId, content));
            participants.push(this.renderParticipant(pool, processId));
            messageFlows.push(...content.messageFlows);
            messageFlowConnections.push(...content.messageFlowConnections);
            processSpecs.push({ id: processId, nodes, content, pool });
        }

        const collaboration = participants.length > 0 || messageFlows.length > 0
            ? this.renderCollaboration(participants, messageFlows)
            : undefined;
        const diagram = this.generateDiagram(processSpecs, participants, messageFlowConnections, collaboration?.id);

        const definitions = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
             xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
             id="Definitions_1"
             targetNamespace="http://bpmn.io/schema/bpmn">
${processes.map(p => `  ${p}`).join('\n')}
${collaboration ? `  ${collaboration.xml}` : ''}
${diagram ? `  ${diagram}` : ''}
</definitions>`;

        return definitions;
    }

    private resetIds(): void {
        this.idCounter = 0;
        this.nameCounts.clear();
        this.nodeIdMap = new WeakMap<Node, string>();
        this.connectionIdMap = new WeakMap<Connection, string>();
    }

    private nextId(baseName: string): string {
        const safeBase = this.sanitizeId(baseName);
        const count = (this.nameCounts.get(safeBase) ?? 0) + 1;
        this.nameCounts.set(safeBase, count);
        return `${safeBase}_${count}`;
    }

    private sanitizeId(value: string): string {
        return value.replace(/[^a-zA-Z0-9_]/g, '_');
    }

    private nodeId(node: Node): string {
        const existing = this.nodeIdMap.get(node);
        if (existing) {
            return existing;
        }
        const id = this.nextId(node.name);
        this.nodeIdMap.set(node, id);
        return id;
    }

    private connectionId(connection: Connection, prefix: string): string {
        const existing = this.connectionIdMap.get(connection);
        if (existing) {
            return existing;
        }
        const id = this.nextId(prefix);
        this.connectionIdMap.set(connection, id);
        return id;
    }

    private generateProcessContent(nodes: Node[], connections: Connection[]): ProcessContent {
        const flows: string[] = [];
        const messageFlows: string[] = [];
        const sequenceFlows: Connection[] = [];
        const associationFlows: Connection[] = [];
        const messageFlowConnections: Connection[] = [];

        const flowInfo = this.collectFlowInfo(connections);
        const elements = nodes.map(node => this.generateNode(node, flowInfo.get(node)));

        for (const connection of connections) {
            if (this.isMessageFlow(connection)) {
                messageFlows.push(this.generateMessageFlow(connection));
                messageFlowConnections.push(connection);
            } else if (this.isAssociation(connection)) {
                associationFlows.push(connection);
                flows.push(this.generateAssociation(connection));
            } else {
                sequenceFlows.push(connection);
                flows.push(this.generateSequenceFlow(connection));
            }
        }

        return { elements, flows, messageFlows, sequenceFlows, associationFlows, messageFlowConnections };
    }

    private renderProcess(processId: string, content: ProcessContent): string {
        const lines = [...content.elements, ...content.flows];
        const body = lines.length > 0 ? `\n${lines.map(l => `    ${l}`).join('\n')}\n  ` : '\n  ';
        return `<process id="${processId}" isExecutable="false">${body}</process>`;
    }

    private renderCollaboration(participants: ParticipantSpec[], messageFlows: string[]): { id: string; xml: string } {
        const lines = [...participants.map((participant) => participant.xml), ...messageFlows];
        const body = lines.length > 0 ? `\n${lines.map(l => `    ${l}`).join('\n')}\n  ` : '\n  ';
        const id = this.nextId('Collaboration');
        return { id, xml: `<collaboration id="${id}">${body}</collaboration>` };
    }

    private renderParticipant(pool: Pool, processId: string): ParticipantSpec {
        const participantId = this.nextId(`Participant_${pool.name}`);
        return { id: participantId, xml: `<participant id="${participantId}" name="${pool.name}" processRef="${processId}" />`, pool };
    }

    private generateNode(node: Node, flowInfo?: { incoming: string[]; outgoing: string[] }): string {
        const incoming = flowInfo?.incoming ?? [];
        const outgoing = flowInfo?.outgoing ?? [];
        if (node.$type === 'Event') {
            return this.generateEvent(node as Event, incoming, outgoing);
        }
        if (node.$type === 'Task') {
            return this.generateTask(node as Task, incoming, outgoing);
        }
        return this.generateGateway(node as Gateway, incoming, outgoing);
    }

    private generateEvent(event: Event, incoming: string[], outgoing: string[]): string {
        const id = this.nodeId(event);
        const eventType = event.eventType || 'intermediate';

        if (eventType === 'start') {
            return this.renderFlowNode('startEvent', id, event.name, incoming, outgoing);
        }
        if (eventType === 'end') {
            return this.renderFlowNode('endEvent', id, event.name, incoming, outgoing);
        }
        return this.renderFlowNode('intermediateThrowEvent', id, event.name, incoming, outgoing);
    }

    private generateTask(task: Task, incoming: string[], outgoing: string[]): string {
        const id = this.nodeId(task);
        const taskType = task.taskType || 'task';

        switch (taskType) {
            case 'user':
                return this.renderFlowNode('userTask', id, task.name, incoming, outgoing);
            case 'service':
                return this.renderFlowNode('serviceTask', id, task.name, incoming, outgoing);
            case 'manual':
                return this.renderFlowNode('manualTask', id, task.name, incoming, outgoing);
            case 'script':
                return this.renderFlowNode('scriptTask', id, task.name, incoming, outgoing);
            case 'send':
                return this.renderFlowNode('sendTask', id, task.name, incoming, outgoing);
            case 'receive':
                return this.renderFlowNode('receiveTask', id, task.name, incoming, outgoing);
            case 'business-rule':
                return this.renderFlowNode('businessRuleTask', id, task.name, incoming, outgoing);
            default:
                return this.renderFlowNode('task', id, task.name, incoming, outgoing);
        }
    }

    private generateGateway(gateway: Gateway, incoming: string[], outgoing: string[]): string {
        const id = this.nodeId(gateway);
        const gatewayType = gateway.gatewayType || 'exclusive';

        switch (gatewayType) {
            case 'exclusive':
                return this.renderFlowNode('exclusiveGateway', id, gateway.name, incoming, outgoing);
            case 'parallel':
                return this.renderFlowNode('parallelGateway', id, gateway.name, incoming, outgoing);
            case 'inclusive':
                return this.renderFlowNode('inclusiveGateway', id, gateway.name, incoming, outgoing);
            case 'event-based':
                return this.renderFlowNode('eventBasedGateway', id, gateway.name, incoming, outgoing);
            case 'complex':
                return this.renderFlowNode('complexGateway', id, gateway.name, incoming, outgoing);
            default:
                return this.renderFlowNode('exclusiveGateway', id, gateway.name, incoming, outgoing);
        }
    }

    private generateSequenceFlow(connection: Connection): string {
        const flowId = this.connectionId(connection, 'Flow');
        const sourceId = this.nodeId(connection.source.ref!);
        const targetId = this.nodeId(connection.target.ref!);
        const label = connection.label || '';

        if (label) {
            return `<sequenceFlow id="${flowId}" sourceRef="${sourceId}" targetRef="${targetId}" name="${label}" />`;
        }
        return `<sequenceFlow id="${flowId}" sourceRef="${sourceId}" targetRef="${targetId}" />`;
    }

    private generateAssociation(connection: Connection): string {
        const associationId = this.connectionId(connection, 'Association');
        const sourceId = this.nodeId(connection.source.ref!);
        const targetId = this.nodeId(connection.target.ref!);
        const label = connection.label || '';

        if (label) {
            return `<association id="${associationId}" sourceRef="${sourceId}" targetRef="${targetId}" name="${label}" />`;
        }
        return `<association id="${associationId}" sourceRef="${sourceId}" targetRef="${targetId}" />`;
    }

    private generateMessageFlow(connection: Connection): string {
        const messageFlowId = this.connectionId(connection, 'MessageFlow');
        const sourceId = this.nodeId(connection.source.ref!);
        const targetId = this.nodeId(connection.target.ref!);
        const label = connection.label || '';

        if (label) {
            return `<messageFlow id="${messageFlowId}" sourceRef="${sourceId}" targetRef="${targetId}" name="${label}" />`;
        }
        return `<messageFlow id="${messageFlowId}" sourceRef="${sourceId}" targetRef="${targetId}" />`;
    }

    private collectContainerElements(container: Pool | Lane): { nodes: Node[]; connections: Connection[] } {
        const nodes: Node[] = [];
        const connections: Connection[] = [];

        const walk = (elements: Array<Node | Connection | Pool | Lane>) => {
            for (const element of elements) {
                if (this.isNode(element)) {
                    nodes.push(element as Node);
                } else if (element.$type === 'Connection') {
                    connections.push(element as Connection);
                } else if (element.$type === 'Lane') {
                    walk((element as Lane).elements);
                }
            }
        };

        walk(container.elements);

        return { nodes, connections };
    }

    private collectFlowInfo(connections: Connection[]): Map<Node, { incoming: string[]; outgoing: string[] }> {
        const map = new Map<Node, { incoming: string[]; outgoing: string[] }>();

        const ensure = (node: Node) => {
            if (!map.has(node)) {
                map.set(node, { incoming: [], outgoing: [] });
            }
            return map.get(node)!;
        };

        for (const connection of connections) {
            if (this.isMessageFlow(connection) || this.isAssociation(connection)) {
                continue;
            }
            const flowId = this.connectionId(connection, 'Flow');
            const source = connection.source.ref!;
            const target = connection.target.ref!;
            ensure(source).outgoing.push(flowId);
            ensure(target).incoming.push(flowId);
        }

        return map;
    }

    private renderFlowNode(tag: string, id: string, name: string, incoming: string[], outgoing: string[]): string {
        if (incoming.length === 0 && outgoing.length === 0) {
            return `<${tag} id="${id}" name="${name}" />`;
        }

        const lines: string[] = [];
        for (const flowId of incoming) {
            lines.push(`<incoming>${flowId}</incoming>`);
        }
        for (const flowId of outgoing) {
            lines.push(`<outgoing>${flowId}</outgoing>`);
        }

        return `<${tag} id="${id}" name="${name}">
      ${lines.join('\n      ')}
    </${tag}>`;
    }

    private isNode(element: unknown): element is Node {
        return !!element && typeof element === 'object' && (
            (element as Node).$type === 'Event' ||
            (element as Node).$type === 'Task' ||
            (element as Node).$type === 'Gateway'
        );
    }

    private isMessageFlow(connection: Connection): boolean {
        return connection.connector === '~~>';
    }

    private isAssociation(connection: Connection): boolean {
        return connection.connector === '--' || connection.connector === '..';
    }

    private generateDiagram(
        processSpecs: ProcessSpec[],
        participants: ParticipantSpec[],
        messageFlowConnections: Connection[],
        collaborationId?: string
    ): string {
        const shapes: string[] = [];
        const edges: string[] = [];
        const nodeBounds = new Map<Node, NodeBounds>();
        const participantBounds = new Map<string, NodeBounds>();

        const lanePadding = 40;
        const processSpacing = 220;
        let processIndex = 0;

        for (const spec of processSpecs) {
            const baseY = 80 + processIndex * processSpacing;
            this.layoutNodes(spec.nodes, baseY, nodeBounds);

            if (spec.pool) {
                const bounds = this.computeBoundsForNodes(spec.nodes, nodeBounds, lanePadding);
                if (bounds) {
                    const participantSpec = participants.find((participant) => participant.pool === spec.pool);
                    if (participantSpec) {
                        participantBounds.set(participantSpec.id, bounds);
                    }
                }
            }
            processIndex += 1;
        }

        for (const spec of processSpecs) {
            for (const node of spec.nodes) {
                const bounds = nodeBounds.get(node);
                if (!bounds) {
                    continue;
                }
                const nodeId = this.nodeId(node);
                shapes.push(this.renderShape(nodeId, bounds));
            }

            for (const connection of spec.content.sequenceFlows) {
                edges.push(this.renderEdge(connection, nodeBounds));
            }
            for (const connection of spec.content.associationFlows) {
                edges.push(this.renderEdge(connection, nodeBounds));
            }
        }

        for (const participant of participants) {
            const participantId = participant.id;
            const bounds = participantBounds.get(participantId);
            if (bounds) {
                shapes.push(this.renderParticipantShape(participantId, bounds));
            }
        }

        for (const connection of messageFlowConnections) {
            edges.push(this.renderMessageEdge(connection, nodeBounds));
        }

        if (shapes.length === 0 && edges.length === 0) {
            return '';
        }

        const planeTarget = collaborationId ?? processSpecs[0]?.id;
        if (!planeTarget) {
            return '';
        }

        const planeLines = [...shapes, ...edges].map(line => `      ${line}`).join('\n');
        return `<bpmndi:BPMNDiagram id="${this.nextId('BPMNDiagram')}">
    <bpmndi:BPMNPlane id="${this.nextId('BPMNPlane')}" bpmnElement="${planeTarget}">
${planeLines}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>`;
    }

    private layoutNodes(nodes: Node[], baseY: number, boundsMap: Map<Node, NodeBounds>): void {
        const startX = 100;
        const spacingX = 180;

        nodes.forEach((node, index) => {
            const size = this.nodeSize(node);
            boundsMap.set(node, {
                x: startX + index * spacingX,
                y: baseY,
                width: size.width,
                height: size.height
            });
        });
    }

    private nodeSize(node: Node): { width: number; height: number } {
        if (node.$type === 'Event') {
            return { width: 36, height: 36 };
        }
        if (node.$type === 'Gateway') {
            return { width: 50, height: 50 };
        }
        return { width: 100, height: 80 };
    }

    private computeBoundsForNodes(nodes: Node[], boundsMap: Map<Node, NodeBounds>, padding: number): NodeBounds | undefined {
        if (nodes.length === 0) {
            return undefined;
        }

        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        for (const node of nodes) {
            const bounds = boundsMap.get(node);
            if (!bounds) {
                continue;
            }
            minX = Math.min(minX, bounds.x);
            minY = Math.min(minY, bounds.y);
            maxX = Math.max(maxX, bounds.x + bounds.width);
            maxY = Math.max(maxY, bounds.y + bounds.height);
        }

        if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
            return undefined;
        }

        return {
            x: minX - padding,
            y: minY - padding,
            width: (maxX - minX) + padding * 2,
            height: (maxY - minY) + padding * 2
        };
    }

    private renderShape(nodeId: string, bounds: NodeBounds): string {
        return `<bpmndi:BPMNShape id="${nodeId}_di" bpmnElement="${nodeId}">
        <dc:Bounds x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" />
      </bpmndi:BPMNShape>`;
    }

    private renderParticipantShape(participantId: string, bounds: NodeBounds): string {
        return `<bpmndi:BPMNShape id="${participantId}_di" bpmnElement="${participantId}" isHorizontal="true">
        <dc:Bounds x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" />
      </bpmndi:BPMNShape>`;
    }

    private renderEdge(connection: Connection, boundsMap: Map<Node, NodeBounds>): string {
        const edgeId = `${this.connectionId(connection, this.isAssociation(connection) ? 'Association' : 'Flow')}_di`;
        const sourceBounds = boundsMap.get(connection.source.ref!);
        const targetBounds = boundsMap.get(connection.target.ref!);
        const sourcePoint = this.centerPoint(sourceBounds);
        const targetPoint = this.centerPoint(targetBounds);
        return `<bpmndi:BPMNEdge id="${edgeId}" bpmnElement="${this.connectionId(connection, this.isAssociation(connection) ? 'Association' : 'Flow')}">
        <di:waypoint x="${sourcePoint.x}" y="${sourcePoint.y}" />
        <di:waypoint x="${targetPoint.x}" y="${targetPoint.y}" />
      </bpmndi:BPMNEdge>`;
    }

    private renderMessageEdge(connection: Connection, boundsMap: Map<Node, NodeBounds>): string {
        const flowId = this.connectionId(connection, 'MessageFlow');
        const edgeId = `${flowId}_di`;
        const sourceBounds = boundsMap.get(connection.source.ref!);
        const targetBounds = boundsMap.get(connection.target.ref!);
        const sourcePoint = this.centerPoint(sourceBounds);
        const targetPoint = this.centerPoint(targetBounds);
        return `<bpmndi:BPMNEdge id="${edgeId}" bpmnElement="${flowId}">
        <di:waypoint x="${sourcePoint.x}" y="${sourcePoint.y}" />
        <di:waypoint x="${targetPoint.x}" y="${targetPoint.y}" />
      </bpmndi:BPMNEdge>`;
    }

    private centerPoint(bounds?: NodeBounds): { x: number; y: number } {
        if (!bounds) {
            return { x: 0, y: 0 };
        }
        return {
            x: Math.round(bounds.x + bounds.width / 2),
            y: Math.round(bounds.y + bounds.height / 2)
        };
    }

}
