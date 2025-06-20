// Tipos para integração com Jira

export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description?: string;
  status: JiraIssueStatus;
  priority: JiraIssuePriority;
  issueType: JiraIssueType;
  assignee?: JiraUser;
  reporter: JiraUser;
  created: string;
  updated: string;
  labels: string[];
  components: JiraComponent[];
  customFields?: Record<string, any>;
}

export interface JiraIssueStatus {
  id: string;
  name: string;
  statusCategory: {
    id: string;
    name: string;
    colorName: string;
  };
}

export interface JiraIssuePriority {
  id: string;
  name: string;
  iconUrl: string;
}

export interface JiraIssueType {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  subtask: boolean;
}

export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls: {
    '16x16': string;
    '24x24': string;
    '32x32': string;
    '48x48': string;
  };
}

export interface JiraComponent {
  id: string;
  name: string;
  description?: string;
}

export interface CreateJiraIssueRequest {
  summary: string;
  description?: string | undefined;
  issueType: string; // ID do tipo de issue
  priority?: string; // ID da prioridade
  assignee?: string; // Account ID do usuário
  labels?: string[];
  components?: string[]; // IDs dos componentes
  customFields?: Record<string, any>;
}

export interface UpdateJiraIssueRequest {
  summary?: string;
  description?: string;
  priority?: string;
  assignee?: string;
  labels?: string[];
  components?: string[];
  customFields?: Record<string, any>;
}

export interface JiraTransition {
  id: string;
  name: string;
  to: JiraIssueStatus;
}

export interface JiraSearchRequest {
  jql: string;
  startAt?: number;
  maxResults?: number;
  fields?: string[];
  expand?: string[];
}

export interface JiraSearchResponse {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  description?: string;
  projectTypeKey: string;
  lead: JiraUser;
  components: JiraComponent[];
  issueTypes: JiraIssueType[];
}

export interface JiraComment {
  id: string;
  author: JiraUser;
  body: string;
  created: string;
  updated: string;
}

export interface CreateJiraCommentRequest {
  body: string;
}

// Tipos para mapeamento com o sistema SaaS
export interface SaasJiraMapping {
  barbershopId: string;
  jiraProjectKey: string;
  issueTypeMapping: {
    bug: string;
    feature: string;
    task: string;
    support: string;
  };
  priorityMapping: {
    low: string;
    medium: string;
    high: string;
    critical: string;
  };
  statusMapping: {
    todo: string;
    inProgress: string;
    done: string;
    cancelled: string;
  };
}

export interface SaasIssueRequest {
  title: string;
  description?: string;
  type: 'bug' | 'feature' | 'task' | 'support';
  priority: 'low' | 'medium' | 'high' | 'critical';
  barbershopId: string;
  assigneeEmail?: string;
  labels?: string[];
}

export interface SaasIssueResponse {
  id: string;
  jiraKey: string;
  title: string;
  description?: string | undefined;
  type: string;
  priority: string;
  status: string;
  assignee?: string | undefined;
  reporter: string;
  created: string;
  updated: string;
  url: string;
}

// Tipos para webhooks do Jira
export interface JiraWebhookEvent {
  timestamp: number;
  webhookEvent: string;
  issue_event_type_name?: string;
  user: JiraUser;
  issue?: JiraIssue;
  changelog?: {
    id: string;
    items: Array<{
      field: string;
      fieldtype: string;
      from: string;
      fromString: string;
      to: string;
      toString: string;
    }>;
  };
}

export interface JiraApiError {
  errorMessages: string[];
  errors: Record<string, string>;
}
