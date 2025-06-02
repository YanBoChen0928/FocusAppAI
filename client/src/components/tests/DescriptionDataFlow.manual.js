/**
 * 目标描述(description)数据流手动测试脚本
 * 
 * 使用本脚本可以手动测试description字段是否在整个数据流中正确传递
 * 将此代码复制到浏览器控制台中执行
 */

// 测试GoalSettingGuide组件中description生成
function testGoalSettingGuideDescriptionGeneration() {
  console.group('测试GoalSettingGuide中的description生成');
  
  // 模拟数据
  const goalData = {
    title: '完成项目',
    motivation: '提高我的技能'
  };
  
  // 生成description
  const generatedDescription = `我想要${goalData.title}，因为${goalData.motivation}。`;
  console.log('预期的description:', generatedDescription);
  
  // 模拟finalGoalData
  const finalGoalData = {
    ...goalData,
    description: generatedDescription
  };
  
  console.log('最终生成的目标数据:', finalGoalData);
  console.log('description字段存在:', !!finalGoalData.description);
  console.log('description长度:', finalGoalData.description.length);
  
  console.groupEnd();
  return finalGoalData;
}

// 测试OnboardingModal中的description处理
function testOnboardingModalDescriptionHandling(finalGoalData) {
  console.group('测试OnboardingModal中的description处理');
  
  // 打印传入的数据
  console.log('从GoalSettingGuide接收的数据:', finalGoalData);
  console.log('description字段存在:', !!finalGoalData.description);
  
  // 模拟检查逻辑
  if (!finalGoalData.description && finalGoalData.title && finalGoalData.motivation) {
    console.warn('WARNING: description字段丢失，生成默认值');
    finalGoalData.description = `我想要${finalGoalData.title}，因为${finalGoalData.motivation}。`;
  }
  
  console.log('传递给API的最终数据:', finalGoalData);
  console.log('最终description:', finalGoalData.description);
  
  console.groupEnd();
  return finalGoalData;
}

// 测试API服务中的description处理
function testApiServiceDescriptionHandling(finalGoalData) {
  console.group('测试API服务中的description处理');
  
  // 打印接收的数据
  console.log('从OnboardingModal接收的数据:', finalGoalData);
  console.log('description字段存在:', !!finalGoalData.description);
  
  // 模拟API服务检查逻辑
  if (!finalGoalData.description && finalGoalData.title && finalGoalData.motivation) {
    console.warn('WARNING: API层发现缺少description字段，自动生成');
    finalGoalData.description = `我想要${finalGoalData.title}，因为${finalGoalData.motivation}。`;
  }
  
  console.log('发送到后端的最终数据:', finalGoalData);
  console.log('最终description:', finalGoalData.description);
  
  console.groupEnd();
  return finalGoalData;
}

// 执行完整测试
function runFullTest() {
  console.group('目标描述(description)数据流完整测试');
  
  // 清晰的分隔线
  console.log('='.repeat(50));
  console.log('开始测试 - description字段数据流');
  console.log('='.repeat(50));
  
  // 测试正常情况 - 有description
  console.log('\n正常情况测试 - 完整数据流:');
  const data1 = testGoalSettingGuideDescriptionGeneration();
  const data2 = testOnboardingModalDescriptionHandling(data1);
  const data3 = testApiServiceDescriptionHandling(data2);
  
  console.log('\n测试结果汇总:');
  console.log('GoalSettingGuide 输出 description:', !!data1.description);
  console.log('OnboardingModal 输出 description:', !!data2.description);
  console.log('API服务 输出 description:', !!data3.description);
  
  // 测试异常情况 - 没有description
  console.log('\n\n异常情况测试 - description丢失:');
  const abnormalData = {
    title: '完成项目',
    motivation: '提高我的技能',
    // 故意省略description
  };
  
  console.log('初始数据(缺少description):', abnormalData);
  const abnormalData2 = testOnboardingModalDescriptionHandling(abnormalData);
  const abnormalData3 = testApiServiceDescriptionHandling(abnormalData2);
  
  console.log('\n异常情况测试结果汇总:');
  console.log('初始数据有description:', !!abnormalData.description);
  console.log('OnboardingModal生成description:', !!abnormalData2.description);
  console.log('API服务生成description:', !!abnormalData3.description);
  
  console.log('='.repeat(50));
  console.log('测试完成');
  console.log('='.repeat(50));
  
  console.groupEnd();
}

// 运行测试
runFullTest(); 