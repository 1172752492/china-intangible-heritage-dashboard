
export interface HeritageItem {
  id: number;
  projectId: number;
  code: string;
  name: string;
  category: string;
  year: string;
  type: '新增项目' | '扩展项目';
  region: string;
  province: string;
  protectionUnit: string;
}

export interface StatData {
  label: string;
  value: number | string;
  unit: string;
  trend?: 'up' | 'down';
}
