import { AstNode, AstNodeDescription, DefaultScopeProvider, ReferenceInfo, Scope, stream } from 'langium';
import { BPMNmlServices } from './bpmn-module.js';
import { BPMN, Connection, Pool, Lane, Node } from '../../generated/ast.js';

/**
 * Custom scope provider for BPMNml.
 * Handles scoping rules for connections within pools and lanes.
 */
export class BPMNmlScopeProvider extends DefaultScopeProvider {

    constructor(services: BPMNmlServices) {
        super(services);
    }

    override getScope(context: ReferenceInfo): Scope {
        // Handle scoping for connection source and target references
        if (context.property === 'source' || context.property === 'target') {
            return this.getScopeForConnection(context.container as Connection);
        }

        return super.getScope(context);
    }

    /**
     * Get the scope for a connection reference.
     * Connections can reference nodes within:
     * 1. The same container (pool/lane)
     * 2. The global scope (if not in a container)
     */
    protected getScopeForConnection(connection: Connection): Scope {
        const container = this.findContainer(connection);
        const nodes: AstNodeDescription[] = [];

        if (connection.connector === '~~>') {
            const bpmn = this.findBPMN(connection);
            if (bpmn) {
                this.collectNodesFromPools(bpmn, nodes);
            }
            return this.createScope(nodes);
        }

        if (container) {
            if (container.$type === 'Lane') {
                const pool = this.findPool(container);
                this.collectNodesFromContainer(pool ?? container, nodes);
            } else {
                // Pool-level connections can reference any node in the pool (including lanes)
                this.collectNodesFromContainer(container, nodes);
            }
        } else {
            // If in global scope, collect all global nodes
            const bpmn = this.findBPMN(connection);
            if (bpmn) {
                this.collectGlobalNodes(bpmn, nodes);
            }
        }

        return this.createScope(nodes);
    }


    /**
     * Find the containing Pool or Lane for a node.
     */
    protected findContainer(node: AstNode): Pool | Lane | undefined {
        let current = node.$container;
        while (current) {
            if (current.$type === 'Pool' || current.$type === 'Lane') {
                return current as Pool | Lane;
            }
            current = current.$container;
        }
        return undefined;
    }

    /**
     * Find the containing Pool for a node or lane.
     */
    protected findPool(node: AstNode): Pool | undefined {
        let current = node.$container;
        while (current) {
            if (current.$type === 'Pool') {
                return current as Pool;
            }
            current = current.$container;
        }
        return undefined;
    }

    /**
     * Find the root BPMN node.
     */
    protected findBPMN(node: AstNode): BPMN | undefined {
        let current = node.$container;
        while (current) {
            if (current.$type === 'BPMN') {
                return current as BPMN;
            }
            current = current.$container;
        }
        return undefined;
    }

    /**
     * Collect all nodes from a container (Pool or Lane).
     */
    protected collectNodesFromContainer(container: Pool | Lane, nodes: AstNodeDescription[]): void {
        for (const element of container.elements) {
            if (this.isNode(element)) {
                nodes.push(this.descriptions.createDescription(element, element.name));
            } else if (element.$type === 'Lane') {
                // Recursively collect from nested lanes
                this.collectNodesFromContainer(element as Lane, nodes);
            }
        }
    }

    /**
     * Collect all nodes from global scope (not inside containers).
     */
    protected collectGlobalNodes(bpmn: BPMN, nodes: AstNodeDescription[]): void {
        for (const element of bpmn.elements) {
            if (this.isNode(element)) {
                nodes.push(this.descriptions.createDescription(element, element.name));
            }
            // Do not descend into pools/lanes for global scope
        }
    }

    /**
     * Collect all nodes from all pools (including nested lanes).
     */
    protected collectNodesFromPools(bpmn: BPMN, nodes: AstNodeDescription[]): void {
        for (const element of bpmn.elements) {
            if (element.$type === 'Pool') {
                this.collectNodesFromContainer(element as Pool, nodes);
            }
        }
    }

    /**
     * Check if an element is a Node (Event, Task, or Gateway).
     */
    protected isNode(element: AstNode): element is Node {
        return element.$type === 'Event' || element.$type === 'Task' || element.$type === 'Gateway';
    }
}
