import { type INode } from 'n8n-workflow';
import {
	AGENT_NODE_TYPE,
	BASIC_CHAIN_NODE_TYPE,
	CHAT_TRIGGER_NODE_TYPE,
	OPEN_AI_ASSISTANT_NODE_TYPE,
	OPEN_AI_NODE_MESSAGE_ASSISTANT_TYPE,
	QA_CHAIN_NODE_TYPE,
} from '@/constants';
import { useWorkflowsStore } from '@/stores/workflows.store';
import type { AddedNode } from '@/Interface';

const AI_NODES = [
	QA_CHAIN_NODE_TYPE,
	AGENT_NODE_TYPE,
	BASIC_CHAIN_NODE_TYPE,
	OPEN_AI_ASSISTANT_NODE_TYPE,
	OPEN_AI_NODE_MESSAGE_ASSISTANT_TYPE,
];

const MEMORY_NODE_NAMES = [
	'@n8n/n8n-nodes-langchain.memoryBufferWindow',
	'@n8n/n8n-nodes-langchain.memoryMotorhead',
	'@n8n/n8n-nodes-langchain.memoryPostgresChat',
	'@n8n/n8n-nodes-langchain.memoryRedisChat',
	'@n8n/n8n-nodes-langchain.memoryXata',
	'@n8n/n8n-nodes-langchain.memoryZep',
];

const PROMPT_PROVIDER_NODE_NAMES = [CHAT_TRIGGER_NODE_TYPE];

export function adjustNewNodes(
	parent: AddedNode,
	child: AddedNode,
	{ parentIsNew = true, childIsNew = true } = {},
) {
	if (childIsNew) adjustNewChild(parent, child);
	if (parentIsNew) adjustNewParent(parent, child);
}

function adjustNewChild(parent: AddedNode, child: AddedNode) {
	console.log('parent', parent);
	console.log('child', child);
	if (AI_NODES.includes(child.type)) {
		const { getCurrentWorkflow } = useWorkflowsStore();
		const workflow = getCurrentWorkflow();

		const ps = [parent, ...(child.name ? workflow.getParentNodesByDepth(child.name, 1) : [])];
		console.log('parents', ps);
		if (
			ps.some((x) =>
				PROMPT_PROVIDER_NODE_NAMES.includes(
					'type' in x ? x.type : (workflow.getNode(x?.name ?? '')?.type ?? ''),
				),
			)
		) {
			Object.assign<AddedNode, Partial<INode>>(child, {
				parameters: { promptType: 'auto' },
			});
		}
	}
}

function adjustNewParent(parent: AddedNode, child: AddedNode) {
	if (MEMORY_NODE_NAMES.includes(parent.type) && child.name) {
		const { getCurrentWorkflow } = useWorkflowsStore();
		const workflow = getCurrentWorkflow();

		// If a memory node is added to an Agent, the memory node is actually the parent since it provides input
		// So we need to look for the Agent's parents to determine if there is a sessionId provider
		const ps = workflow.getParentNodesByDepth(child.name, 1);
		if (
			!ps.some((x) => PROMPT_PROVIDER_NODE_NAMES.includes(workflow.getNode(x.name)?.type ?? ''))
		) {
			Object.assign<AddedNode, Partial<INode>>(parent, {
				parameters: { sessionIdType: 'customKey' },
			});
		}
	}
}
