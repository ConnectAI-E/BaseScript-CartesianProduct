import type { Env, Language } from '@lark-base-open/web-api';

export interface I18nText {
  HeaderInfo: string;
  SelectConnectTable: string;
  SelectOutputTable: string;
  SubmitButton: string;
  StartConnect: string;
  ConnectSuccess: string;
  SelectConnectCountWarning: string;
  GetTableData: string;
  TranslateTableData: string;
  ConnectTableData: string;
  SwitchOutputTable: string;
  ClearOutputTableData: string;
  WriteTableData: string;
}

export const Text: { [key: string]: I18nText } = {
  en: {
    HeaderInfo: `#### Data Table Fusion (Cartesian Product)
For any questions, please refer to the [Script User Guide](https://bytedance.feishu.cn/docx/StZtdaOj1otO6hxGfoDcC70Cnvc)`,
    SelectConnectTable: 'Please select the tables to be fused',
    SelectOutputTable:
      'Please select the table to receive the results (executing the script will clear the existing data in this table)',
    SubmitButton: 'Submit',
    StartConnect: 'Start Fusion',
    ConnectSuccess: 'Fusion Success',
    SelectConnectCountWarning: 'Please select at least two tables to be fused',
    GetTableData: 'Read Table Data',
    TranslateTableData: 'Transform Table Data',
    ConnectTableData: 'Fuse Table Data',
    SwitchOutputTable: 'Open Result Table',
    ClearOutputTableData: 'Clear existing data in the result table',
    WriteTableData: 'Write fused data to the result table',
  },
  zh: {
    HeaderInfo: `#### 数据表融合（笛卡尔积）
有疑问请看这里 👉 [脚本使用指南](https://bytedance.feishu.cn/docx/NakhdL5CsohV77xWn46c6YaWncg)  `,
    SelectConnectTable: '请选择要融合的数据表',
    SelectOutputTable: '请选择接收结果的数据表（脚本执行将清空该表中原有数据）',
    SubmitButton: '确定',
    StartConnect: '开始融合',
    ConnectSuccess: '融合成功',
    SelectConnectCountWarning: '请至少选择两张要融合的数据表',
    GetTableData: '读取表数据',
    TranslateTableData: '转换表数据',
    ConnectTableData: '融合表数据',
    SwitchOutputTable: '打开结果表',
    ClearOutputTableData: '清空结果表中原有数据',
    WriteTableData: '将融合后数据写入结果表',
  },
};

export function getText(lang: Language, env: Env): I18nText {
  let l: 'en' | 'zh' = 'en';
  if (['zh', 'zh-HK', 'zh-TW', 'en'].includes(lang)) {
    l = lang === 'en' ? 'en' : 'zh';
  } else {
    l = env.product === 'feishu' ? 'zh' : 'en';
  }
  return Text[l];
}
