import { serializeDocumentContent } from '@docweave/adapters'
import type { DocumentContent, DocumentStatus } from '@docweave/contracts/document'
import Document from '#models/document'
import DocumentSnapshot from '#models/document_snapshot'
import RagIndexJob from '#models/rag_index_job'
import Space from '#models/space'
import SpaceMember from '#models/space_member'
import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

type SeedDocument = {
  id: string
  spaceId: string
  title: string
  summary: string
  status: DocumentStatus
  sections: Array<{ heading: string; focus: string }>
}

const spaces = [
  {
    id: 'rag-engineering',
    name: 'RAG 工程实践',
    summary: '检索增强生成的设计、评估、索引与运行治理。',
  },
  {
    id: 'agent-systems',
    name: 'Agent 系统设计',
    summary: '面向任务分解、工具调用、状态管理与可靠性的实践知识库。',
  },
  {
    id: 'llm-platform',
    name: 'LLM 应用平台',
    summary: '模型选择、提示词、上下文、成本与质量治理的团队资料。',
  },
  {
    id: 'skill-library',
    name: 'Skill 设计手册',
    summary: '将专业流程封装为可复用 Agent Skill 的方法与规范。',
  },
  {
    id: 'mcp-integration',
    name: 'MCP 集成中心',
    summary: 'Model Context Protocol 服务、工具边界与安全接入实践。',
  },
]

const documents: SeedDocument[] = [
  {
    id: 'rag-indexing-blueprint',
    spaceId: 'rag-engineering',
    title: 'RAG 索引管线设计蓝图',
    status: 'ready',
    summary: '从稳定快照到可追溯向量点的 RAG 索引设计与运营原则。',
    sections: [
      {
        heading: '问题边界',
        focus:
          'RAG 的输入不是任意网页或运行中的编辑器状态，而是经过权限确认、版本固定且可重复读取的内容快照。',
      },
      {
        heading: '内容切分',
        focus:
          '切分应尊重标题、段落和列表等语义边界；每个 chunk 必须保留所属文档、快照版本、块标识和标题路径。',
      },
      {
        heading: '向量与元数据',
        focus:
          '向量只负责语义近邻，过滤与引用依赖完整元数据。不要把权限、当前版本或来源位置藏在提示词中。',
      },
      {
        heading: '发布策略',
        focus:
          '索引任务成功后才能把对应版本声明为 active；失败或过期任务不能覆盖已可用版本，也不能让旧点参与检索。',
      },
      {
        heading: '质量评估',
        focus:
          '评估要同时观察召回率、引用正确率、答案忠实度和延迟，并按问题类型建立可回归的基准集。',
      },
      {
        heading: '运行治理',
        focus:
          '索引过程需要可观测的队列状态、错误码和重试策略，人工排障时能够从 Citation 回溯到原始内容块。',
      },
    ],
  },
  {
    id: 'rag-evaluation-playbook',
    spaceId: 'rag-engineering',
    title: 'RAG 检索与问答评估手册',
    status: 'review',
    summary: '建立离线基准、线上反馈和故障复盘闭环，避免只凭主观感觉调整检索。',
    sections: [
      {
        heading: '评估目标',
        focus:
          '评估的目标不是让模型写得更像答案，而是验证系统是否找到了授权范围内、足以支撑回答的证据。',
      },
      {
        heading: '基准集构建',
        focus:
          '每条样本应记录问题、允许来源、关键事实、不可回答条件与预期拒答行为，并覆盖短问句和复杂任务。',
      },
      {
        heading: '检索指标',
        focus:
          '对每个问题分别计算候选覆盖、正确文档命中、正确 chunk 命中和排序位置，避免平均分掩盖关键失败。',
      },
      {
        heading: '回答指标',
        focus:
          '回答必须区分有依据的归纳和模型补全；Citation 是否真实支持句子、是否遗漏重要限制是核心检查项。',
      },
      {
        heading: '线上信号',
        focus:
          '记录搜索改写、无结果、点击 Citation、停止生成和人工纠正等行为，但不得把用户私有内容写入无权限日志。',
      },
      {
        heading: '复盘节奏',
        focus:
          '每次质量回退都应定位到语料、切分、embedding、过滤、提示词或模型之一，并把修复转化为回归样本。',
      },
    ],
  },
  {
    id: 'agent-runtime-architecture',
    spaceId: 'agent-systems',
    title: 'Agent 运行时架构与状态边界',
    status: 'ready',
    summary: '定义 Agent 的计划、工具执行、上下文压缩和人工介入边界。',
    sections: [
      {
        heading: 'Agent 的职责',
        focus:
          'Agent 应编排目标、上下文和受控工具，不应绕过领域服务直接写数据库，更不应把不确定推理伪装为确定事实。',
      },
      {
        heading: '任务分解',
        focus:
          '把长任务拆为有输入输出和验收条件的步骤；当子任务依赖用户选择或外部授权时必须显式停下。',
      },
      {
        heading: '状态模型',
        focus:
          '运行状态应区分计划、执行、等待、失败和完成，并保存能解释当前决策的最小证据而不是完整思维过程。',
      },
      {
        heading: '工具边界',
        focus:
          '工具调用应使用结构化参数、最小权限和稳定错误码。读操作与写操作需要不同的确认策略和审计级别。',
      },
      {
        heading: '失败恢复',
        focus:
          '失败后先检查输入、权限、依赖和幂等性；连续失败不应无限重试，而要升级给人类或回退到安全路径。',
      },
      {
        heading: '可观测性',
        focus:
          '记录任务标识、工具耗时、结果摘要和失败分类，使团队能判断是模型质量、工具契约还是数据质量造成问题。',
      },
    ],
  },
  {
    id: 'agent-tooling-governance',
    spaceId: 'agent-systems',
    title: 'Agent 工具调用治理清单',
    status: 'draft',
    summary: '为工具设计权限、幂等、确认和审计规则，控制 Agent 的实际影响范围。',
    sections: [
      {
        heading: '工具分级',
        focus:
          '按只读查询、可逆写入、不可逆写入和外部通信分级，分级决定是否需要用户确认、审批记录或额外防护。',
      },
      {
        heading: '参数验证',
        focus: '工具入口必须验证类型、范围和资源归属；不要依赖模型自然语言承诺来确保参数正确。',
      },
      {
        heading: '权限委托',
        focus:
          'Agent 只能使用当前用户授予的身份范围，服务端必须再次校验，不能把前端传入的空间或用户标识当成授权。',
      },
      {
        heading: '幂等与重试',
        focus: '写操作提供幂等键或明确重复语义；网络重试前先确认前一次调用是否已经改变了目标状态。',
      },
      {
        heading: '人工确认',
        focus:
          '涉及发送、删除、共享、付款或敏感数据传输的动作，在真正执行前给出目标、影响和数据范围。',
      },
      {
        heading: '审计与回滚',
        focus:
          '审计记录应能回答谁在何时以何种授权调用了什么工具；可逆变更要提供恢复路径和操作说明。',
      },
    ],
  },
  {
    id: 'llm-prompt-context-guide',
    spaceId: 'llm-platform',
    title: 'LLM 提示词与上下文工程指南',
    status: 'ready',
    summary: '用清晰任务契约、可靠上下文和可测输出约束提升模型应用质量。',
    sections: [
      {
        heading: '任务契约',
        focus:
          '提示词首先说明目标、输入、输出格式、边界和失败行为；模糊的角色描述无法替代可验证的任务定义。',
      },
      {
        heading: '上下文选择',
        focus:
          '上下文应按权限和相关性裁剪，优先提供原始来源、时间与适用范围，避免塞入大量无关材料稀释注意力。',
      },
      {
        heading: '结构化输出',
        focus:
          '需要被程序消费的结果使用 JSON Schema 或明确字段约束，并在服务端验证，而不是依赖模型每次都格式正确。',
      },
      {
        heading: '示例策略',
        focus:
          '少量高质量示例应覆盖边界案例、拒答案例和格式案例；示例中的事实不能与当前上下文冲突。',
      },
      {
        heading: '模型路由',
        focus: '按任务难度、延迟、上下文长度和成本选择模型，关键链路用固定评测集验证切换效果。',
      },
      {
        heading: '安全约束',
        focus:
          '把不可信用户内容与系统指令隔离，明确工具可用范围，要求模型在证据不足时承认不确定而不是编造。',
      },
    ],
  },
  {
    id: 'llm-cost-reliability',
    spaceId: 'llm-platform',
    title: 'LLM 成本、延迟与可靠性治理',
    status: 'review',
    summary: '平衡模型效果、token 成本和稳定性，并把异常转化为可运营指标。',
    sections: [
      {
        heading: '成本模型',
        focus:
          '统计输入、输出、缓存命中、重试和工具调用成本，并按功能和租户归集，才能判断优化是否真正有效。',
      },
      {
        heading: '延迟预算',
        focus:
          '将检索、重排、首 token、完整生成和工具往返分段测量；用户体验通常更依赖首个有效反馈而非总耗时。',
      },
      {
        heading: '降级策略',
        focus:
          '供应商超时或限流时可以缩短上下文、选择备用模型或返回可解释的稍后重试状态，不能静默伪造成功。',
      },
      {
        heading: '缓存边界',
        focus:
          '缓存键必须包含模型、提示词版本、授权范围和关键输入；涉及私有数据时尤其要防止跨用户复用。',
      },
      {
        heading: '版本管理',
        focus:
          '模型、系统提示词、检索配置和工具 schema 都应可追溯版本，线上问题才能准确回放和比较。',
      },
      {
        heading: '告警与容量',
        focus:
          '针对错误率、超时率、token 峰值和供应商配额建立告警，并提前验证高峰期的限流和排队行为。',
      },
    ],
  },
  {
    id: 'skill-authoring-handbook',
    spaceId: 'skill-library',
    title: 'Skill 编写与维护手册',
    status: 'ready',
    summary: '把重复的专业工作流沉淀为触发明确、步骤可执行、边界清晰的 Skill。',
    sections: [
      {
        heading: '适用问题',
        focus:
          'Skill 适合稳定、重复且有领域约束的流程，不适合用来掩盖尚未澄清的产品需求或不断变化的临时决策。',
      },
      {
        heading: '触发条件',
        focus:
          '描述用户意图、关键词和反例，避免 Skill 被过度触发；多个 Skill 重叠时要明确优先级和组合顺序。',
      },
      {
        heading: '操作步骤',
        focus:
          '每一步写明需要读取的事实、允许的工具和完成标准，关键安全门禁不能只写成笼统的“谨慎处理”。',
      },
      {
        heading: '上下文控制',
        focus: '只加载任务必需的引用资料，优先给出索引和路由规则，避免把巨量文档塞入每一次执行。',
      },
      {
        heading: '验证标准',
        focus: '将测试、构建、人工检查和产物审查按风险列出，使使用者能够判断工作是否真的结束。',
      },
      {
        heading: '演进机制',
        focus:
          '通过真实失败案例更新 Skill；变更触发条件或授权范围时必须回归验证，避免旧经验造成错误自动化。',
      },
    ],
  },
  {
    id: 'skill-quality-rubric',
    spaceId: 'skill-library',
    title: 'Skill 质量评审量表',
    status: 'draft',
    summary: '用一致量表评审 Skill 的清晰度、可执行性、安全性和长期维护成本。',
    sections: [
      {
        heading: '清晰度',
        focus:
          '读者应在首次阅读时理解 Skill 解决什么问题、何时触发、需要哪些输入以及最后会产生什么结果。',
      },
      {
        heading: '可执行性',
        focus:
          '步骤必须映射到可用工具或明确的人类动作，不能要求模型访问不存在的系统或凭空推断受限数据。',
      },
      {
        heading: '安全性',
        focus:
          '评审写入、删除、外发和权限变更路径，确认授权由用户明确给出，且敏感数据不会因为日志或缓存泄露。',
      },
      {
        heading: '可测试性',
        focus:
          '至少准备一个成功案例、一个边界案例和一个失败案例；对关键分支用断言而非主观描述验证。',
      },
      {
        heading: '可维护性',
        focus: '将易变配置、接口版本和参考文档集中引用，避免在多个段落复制同一规则导致更新漂移。',
      },
      {
        heading: '审查结论',
        focus: '评审结论应区分阻断问题、重要缺口和可选优化，并把需要后续验证的风险记录到明确位置。',
      },
    ],
  },
  {
    id: 'mcp-server-design',
    spaceId: 'mcp-integration',
    title: 'MCP Server 设计与安全边界',
    status: 'ready',
    summary: '设计可发现、可验证且不绕过业务授权的 Model Context Protocol 服务。',
    sections: [
      {
        heading: '能力建模',
        focus:
          '将 MCP 能力拆为资源、工具和提示词：资源用于读取上下文，工具用于有参数的业务动作，避免把所有事情塞进一个命令。',
      },
      {
        heading: '身份边界',
        focus:
          'MCP transport 身份必须映射到应用用户或明确拒绝；没有身份映射时绝不能返回真实私有数据或调用高权限服务。',
      },
      {
        heading: '工具契约',
        focus:
          '工具参数使用结构化 schema，返回值区分成功、业务失败和系统失败。描述要包含影响范围，不要泄露内部实现细节。',
      },
      {
        heading: '授权复用',
        focus:
          'MCP 与 HTTP 必须复用同一个领域权限 resolver，不能因接入方式不同产生一条绕过 space_members 的旁路。',
      },
      {
        heading: '错误处理',
        focus:
          '向调用方返回稳定错误码和可行动消息，服务端日志保留诊断细节；不要把数据库、密钥或第三方响应原样透出。',
      },
      {
        heading: '发布治理',
        focus:
          '版本化工具名和 schema，记录调用审计，灰度发布高风险能力，并在协议升级时保持旧客户端的可预测失败方式。',
      },
    ],
  },
  {
    id: 'mcp-tool-catalog',
    spaceId: 'mcp-integration',
    title: 'MCP 工具目录与接入检查表',
    status: 'review',
    summary: '为团队维护 MCP 工具登记、测试边界与上线检查项目。',
    sections: [
      {
        heading: '登记信息',
        focus:
          '每个工具登记所有者、业务目标、输入输出 schema、权限模型、数据分类、限流策略和故障联系人。',
      },
      {
        heading: '资源选择',
        focus:
          '稳定、可浏览的内容使用资源；需要执行查询或修改的能力使用工具。选择错误会让调用语义和安全审计变得模糊。',
      },
      {
        heading: '接入测试',
        focus:
          '测试未认证、无权限、校验失败、空结果、依赖超时和取消请求，确认每一条路径都不会泄露跨空间信息。',
      },
      {
        heading: '开发环境',
        focus:
          '本地开发使用可重置测试数据和最小权限账号，避免调试期间误连生产服务或使用真实客户内容。',
      },
      {
        heading: '文档质量',
        focus:
          '工具描述应告诉 Agent 何时调用、何时不要调用、成功会改变什么；不清晰的描述会直接放大错误调用频率。',
      },
      {
        heading: '上线复核',
        focus:
          '上线前复核身份映射、审计日志、速率限制、回滚步骤和依赖可用性，并在变更后重新跑兼容性测试。',
      },
    ],
  },
]

export default class extends BaseSeeder {
  async run() {
    const currentSpaceIds = spaces.map((space) => space.id)
    const obsoleteDocuments = await Document.query().whereNotIn('space_id', currentSpaceIds)
    const obsoleteDocumentIds = obsoleteDocuments.map((document) => document.id)

    // 开发 seed 只保留当前主题知识库；先清理派生记录，再删除旧空间与文档。
    if (obsoleteDocumentIds.length > 0) {
      await RagIndexJob.query().whereIn('document_id', obsoleteDocumentIds).delete()
      await DocumentSnapshot.query().whereIn('document_id', obsoleteDocumentIds).delete()
      await Document.query().whereIn('id', obsoleteDocumentIds).delete()
    }
    await SpaceMember.query().whereNotIn('space_id', currentSpaceIds).delete()
    await Space.query().whereNotIn('id', currentSpaceIds).delete()

    const seededDocumentIds = documents.map((document) => document.id)
    // seed 会替换正文，因此同步废弃旧快照与 active index，避免同版本旧 points 产生失效 Citation。
    await RagIndexJob.query().whereIn('document_id', seededDocumentIds).delete()
    await DocumentSnapshot.query().whereIn('document_id', seededDocumentIds).delete()
    await Document.query().whereIn('id', seededDocumentIds).update({
      latestSnapshotVersion: null,
      latestIndexedVersion: null,
    })

    const users = await User.updateOrCreateMany('email', [
      { email: 'owner@docweave.dev', fullName: 'DocWeave Owner', password: 'docweave123' },
      { email: 'editor@docweave.dev', fullName: 'DocWeave Editor', password: 'docweave123' },
    ])
    const owner = users.find((user) => user.email === 'owner@docweave.dev')!
    const editor = users.find((user) => user.email === 'editor@docweave.dev')!

    for (const space of spaces) {
      await Space.updateOrCreate({ id: space.id }, space)
      await SpaceMember.updateOrCreate({ spaceId: space.id, userId: owner.id }, { role: 'owner' })
    }

    // 编辑账号用于验证 viewer 的可见范围；目前产品尚未提供成员邀请 UI。
    for (const spaceId of ['rag-engineering', 'skill-library', 'mcp-integration']) {
      await SpaceMember.updateOrCreate({ spaceId, userId: editor.id }, { role: 'viewer' })
    }

    for (const document of documents) {
      await Document.updateOrCreate(
        { id: document.id },
        {
          spaceId: document.spaceId,
          title: document.title,
          summary: document.summary,
          status: document.status,
          content: serializeDocumentContent(
            createArticleContent(document.title, document.sections)
          ),
        }
      )
    }
  }
}

function createArticleContent(title: string, sections: SeedDocument['sections']): DocumentContent {
  const blocks: DocumentContent = [
    { type: 'heading', props: { level: 1 }, content: title },
    {
      type: 'paragraph',
      content: `本文是 DocWeave 开发环境中的主题知识文档，围绕“${title}”沉淀可被团队讨论、编辑和检索的工程经验。内容强调可执行的边界、可验证的结论以及与真实业务数据模型一致的权限约束。阅读时应把每个章节视为一个可独立引用的知识单元：它既能支持人工协作，也能在创建稳定快照并完成索引后成为 RAG 问答的可靠来源。`,
    },
  ]

  for (const section of sections) {
    blocks.push({ type: 'heading', props: { level: 2 }, content: section.heading })
    blocks.push({
      type: 'paragraph',
      content: `${section.focus} 在实际落地时，团队需要先写清楚输入来自哪里、输出由谁消费、失败时系统如何恢复，以及哪些决策必须由人确认。只要其中任意一项没有定义，后续的实现就容易把临时假设固化成接口行为，最终表现为数据无法追溯、权限无法解释或用户无法判断当前状态。`,
    })
    blocks.push({
      type: 'paragraph',
      content: `建议将这一部分拆成可验证的小步骤：先用真实样本建立最小成功路径，再补齐越权、空输入、版本过期和依赖故障等反例。每一次改动都应保留足够的元数据，例如所属空间、文档版本、调用身份和时间；这些信息不是日志装饰，而是排障、审计和 Citation 回跳的基础。对于需要自动化的流程，应把幂等性、取消和重试语义放在领域服务中，而不是散落在页面或模型提示词里。`,
    })
    blocks.push({
      type: 'paragraph',
      content: `从协作角度看，结论必须能够被其他成员复现。文档应说明已知限制、适用范围和下一步观察指标，而不是只给出一次性的“最佳实践”口号。当质量、成本或安全目标发生冲突时，优先选择可回滚、可监控且不会扩大权限的方案。这样，即使模型、供应商或数据规模变化，团队仍然可以依据明确的契约逐层定位问题，并持续更新这份知识资产。`,
    })
  }

  blocks.push({ type: 'heading', props: { level: 2 }, content: '结语与行动项' })
  blocks.push({
    type: 'paragraph',
    content: `将本文转化为实际工作时，请先确认当前空间成员关系、文档正文是否已保存、稳定快照版本是否存在，以及索引任务是否已成功发布。之后再通过知识库搜索或单轮问答验证引用是否能回到正确的文档块。若发现答案缺少依据、索引落后正文或权限范围异常，应优先修复数据与契约边界，而不是仅调整模型措辞。`,
  })

  return blocks
}
