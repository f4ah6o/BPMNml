import type { AstNode, ValidationAcceptor, ValidationChecks, ValidationRegistry } from 'langium';
import type { BPMNmlAstType, Connection, Node, Pool, Lane, BPMN } from '../../generated/ast.js';
import type { BPMNmlServices } from './bpmn-module.js';

/**
 * Registry for validation checks.
 */
export class BPMNmlValidator {

    constructor(protected services: BPMNmlServices) {}

    /**
     * Register custom validation checks.
     */
    registerValidationChecks(checksRegistry: ValidationRegistry) {
        const checks: ValidationChecks<BPMNmlAstType> = {
            Connection: this.checkConnection,
            BPMN: this.checkDuplicateNodeNames,
            Pool: this.checkPoolElements,
            Lane: this.checkLaneElements
        };
        checksRegistry.register(checks, this);
    }

    /**
     * Validate that a connection's source and target nodes exist and are valid.
     */
    checkConnection(connection: Connection, accept: ValidationAcceptor): void {
        if (!connection.source || !connection.source.ref) {
            accept('error', 'Connection source node is not defined.', { node: connection, property: 'source' });
        }
        if (!connection.target || !connection.target.ref) {
            accept('error', 'Connection target node is not defined.', { node: connection, property: 'target' });
        }

        if (connection.source?.ref && connection.target?.ref) {
            const sourcePool = this.findPoolForNode(connection.source.ref);
            const targetPool = this.findPoolForNode(connection.target.ref);
            const isMessageFlow = connection.connector === '~~>';

            if (isMessageFlow) {
                if (!sourcePool || !targetPool) {
                    accept('error', 'Message flows must connect nodes in different pools.', { node: connection });
                } else if (sourcePool === targetPool) {
                    accept('error', 'Message flows cannot connect nodes within the same pool.', { node: connection });
                }
            } else {
                if (sourcePool && targetPool && sourcePool !== targetPool) {
                    accept('error', 'Connections cannot cross pool boundaries.', { node: connection });
                } else if ((sourcePool && !targetPool) || (!sourcePool && targetPool)) {
                    accept('error', 'Connections cannot mix pooled and unpooled nodes.', { node: connection });
                }
            }
        }

        // Check for self-loops
        if (connection.source?.ref && connection.target?.ref) {
            if (connection.source.ref === connection.target.ref) {
                accept('warning', 'Self-loops are not recommended in BPMN.', { node: connection });
            }
        }
    }

    /**
     * Check for duplicate node names in the BPMN model.
     */
    checkDuplicateNodeNames(bpmn: BPMN, accept: ValidationAcceptor): void {
        const nodeNames = new Set<string>();
        const containers = new Map<string, Set<string>>();

        const checkNode = (node: Node, containerName?: string) => {
            const scope = containerName || 'global';

            if (!containers.has(scope)) {
                containers.set(scope, new Set());
            }

            const scopeNodes = containers.get(scope)!;

            if (scopeNodes.has(node.name)) {
                accept('error', `Duplicate node name '${node.name}' in ${scope} scope.`, { node, property: 'name' });
            } else {
                scopeNodes.add(node.name);
            }

            // Also check global scope for cross-container references
            if (containerName && nodeNames.has(node.name)) {
                accept('warning', `Node name '${node.name}' is used in multiple containers.`, { node, property: 'name' });
            }
            nodeNames.add(node.name);
        };

        const processElements = (elements: any[], containerName?: string) => {
            for (const element of elements) {
                if ('name' in element && (element.$type === 'Event' || element.$type === 'Task' || element.$type === 'Gateway')) {
                    checkNode(element as Node, containerName);
                } else if (element.$type === 'Pool') {
                    processElements(element.elements, element.name);
                } else if (element.$type === 'Lane') {
                    processElements(element.elements, containerName ? `${containerName}.${element.name}` : element.name);
                }
            }
        };

        processElements(bpmn.elements);
    }

    /**
     * Validate pool elements.
     */
    checkPoolElements(pool: Pool, accept: ValidationAcceptor): void {
        if (pool.elements.length === 0) {
            accept('warning', 'Pool is empty. Consider adding lanes or elements.', { node: pool, property: 'name' });
        }
    }

    /**
     * Validate lane elements.
     */
    checkLaneElements(lane: Lane, accept: ValidationAcceptor): void {
        if (lane.elements.length === 0) {
            accept('warning', 'Lane is empty. Consider adding elements.', { node: lane, property: 'name' });
        }
    }

    /**
     * Find the containing pool for a node, if any.
     */
    protected findPoolForNode(node: Node): Pool | undefined {
        let current: AstNode | undefined = node.$container;
        while (current) {
            if (current.$type === 'Pool') {
                return current as Pool;
            }
            current = current.$container;
        }
        return undefined;
    }
}
