import { DataSource, DataSourceOptions, Repository } from 'typeorm';
import { Template } from '@entities';
import { dataSourceOptions } from '../db-config';

export class TemplateSeeder {
  async run(): Promise<void> {
    enum ActionType {
      Update = 'Update',
      Create = 'Create',
    }

    const action: ActionType = ActionType.Create;

    const dataSource = new DataSource(dataSourceOptions as DataSourceOptions);
    await dataSource.initialize();
    const templateRepository: Repository<Template> = dataSource.getRepository(Template);

    const templates = [
      {
        title: 'SOAP Notes',
        language: 'en',
        prompt:
          "Generate me SOAP Notes With the Following Sections:\n\nSubjective:\nDescribe the patient's symptoms, complaints, and medical history relevant to the visit.\n\nObjective:\nRecord measurable clinical findings, including vital signs, physical examination results, and test outcomes.\n\nAssessment:\nProvide a diagnosis or clinical impression based on subjective and objective data.\n\nPlan:\nOutline the treatment strategy, prescriptions, follow-up plans, and patient instructions.",
      },
      {
        title: 'SIRP Notes',
        language: 'en',
        prompt:
          'Generate a structured SIRP note based on the following patient encounter details:\n\nSituation (S): Describe the primary reason for the visit, including symptoms, duration, and any relevant context.\n\nIntervention (I): Outline the assessments, tests, and treatments performed during the visit.\n\nResponse (R): Document how the patient responded to interventions or initial treatments.\n\nPlan (P): Specify the next steps, including further tests, medications, follow-up appointments, and patient instructions.',
      },
      {
        title: 'DAP Notes',
        language: 'en',
        prompt:
          'Generate a structured DAP note based on the session details:\n\nData (D): Summarize observations, patient-reported symptoms, and any test results.\n\nAssessment (A): Provide an interpretation of the data, including clinical impressions, progress, and concerns.\n\nPlan (P): Outline treatment recommendations, therapy plans, follow-up visits, or any modifications to the care strategy.',
      },
      {
        title: 'BIRP Notes',
        language: 'en',
        prompt:
          'Generate a structured BIRP note based on the patient encounter details:\n\nBehavior (B): Describe the patient’s verbal and non-verbal expressions, symptoms, and behavioral observations.\n\nIntervention (I): Document the therapeutic interventions, assessments, and treatments provided.\n\nResponse (R): Record how the patient responded to the interventions.\n\nPlan (P): Outline follow-up steps, treatment adjustments, and next visit details.',
      },
      {
        title: 'Psychotherapy Progress Notes',
        language: 'en',
        prompt:
          'Generate a Psychotherapy Progress Note including the following:\n\nSession Overview:\nDescribe the main focus of the therapy session and key issues discussed.\n\nIntervention Used:\nList therapeutic techniques and interventions applied during the session.\n\nPatient Response:\nSummarize how the patient engaged and responded to the session.\n\nPlan:\nOutline recommendations, homework assignments, next session goals, and follow-up actions.',
      },
      {
        title: 'Pediatric Progress Notes',
        language: 'en',
        prompt:
          'Generate a Pediatric Progress Note with the following structure:\n\nChief Complaint:\nSummarize the reason for the visit in the caregiver’s and/or child’s own words.\n\nHistory of Present Illness:\nDetail symptom onset, duration, severity, and any interventions attempted at home.\n\nDevelopmental and Behavioral Observations:\nRecord the child’s motor skills, cognitive function, speech, and behavioral responses.\n\nAssessment:\nProvide diagnostic impressions and relevant test findings.\n\nPlan:\nOutline treatment steps, medication recommendations, and follow-up schedules.',
      },
      {
        title: 'Discharge Summary',
        language: 'en',
        prompt:
          'Generate a Discharge Summary with the following structure:\n\nAdmission Details:\nInclude admission date, reason for hospitalization, and initial diagnosis.\n\nHospital Course:\nSummarize key events, tests, and treatments provided during the hospital stay.\n\nDischarge Diagnosis:\nList primary and secondary diagnoses at discharge.\n\nMedications:\nProvide a list of medications prescribed upon discharge.\n\nFollow-up Plan:\nSpecify post-discharge instructions, follow-up appointments, and care recommendations.',
      },
      {
        title: 'Operative Report',
        language: 'en',
        prompt:
          'Generate an Operative Report including the following details:\n\nPreoperative Diagnosis:\nList the condition(s) necessitating the surgery.\n\nPostoperative Diagnosis:\nProvide a summary of the final diagnosis after the procedure.\n\nProcedure Performed:\nDescribe the surgical intervention and key steps involved.\n\nFindings:\nDetail observations made during the procedure.\n\nComplications:\nDocument any intraoperative complications or issues encountered.\n\nPlan:\nOutline post-operative care, medication, and follow-up instructions.',
      },
      {
        title: 'Mental Health Assessment',
        language: 'en',
        prompt:
          "Generate a Mental Health Assessment report with the following sections:\n\nPresenting Problem:\nDescribe the patient's primary mental health concern and symptoms.\n\nPsychiatric History:\nSummarize past diagnoses, treatments, hospitalizations, and medication history.\n\nMental Status Examination:\nRecord the patient’s appearance, behavior, mood, thought processes, and cognitive function.\n\nAssessment:\nProvide diagnostic impressions based on clinical evaluation.\n\nPlan:\nRecommend therapy, medications, referrals, and follow-up steps.",
      },
      {
        title: 'Geriatric Care Note',
        language: 'en',
        prompt:
          'Generate a Geriatric Care Note covering the following:\n\nChief Complaint:\nDetail the primary concerns from the patient or caregiver’s perspective.\n\nFunctional Status:\nAssess mobility, daily living activities, and cognitive function.\n\nChronic Conditions:\nList ongoing medical conditions and their current management status.\n\nMedications:\nProvide an updated medication list with adherence notes.\n\nPlan:\nSpecify interventions, caregiver instructions, and follow-up recommendations.',
      },
      {
        title: 'ملاحظات SOAP',
        language: 'ar',
        prompt:
          'أنشئ ملاحظات SOAP بالمكونات التالية:\n\nالذاتية:\nوصف أعراض المريض، الشكاوى، والتاريخ الطبي المتعلق بالزيارة.\n\nالموضوعية:\nتسجيل النتائج السريرية القابلة للقياس، بما في ذلك العلامات الحيوية، نتائج الفحص البدني، والاختبارات.\n\nالتقييم:\nتقديم التشخيص أو الانطباع السريري بناءً على البيانات الذاتية والموضوعية.\n\nالخطة:\nتحديد استراتيجية العلاج، الوصفات الطبية، خطط المتابعة، وتعليمات المريض.',
      },
      {
        title: 'ملاحظات SIRP',
        language: 'ar',
        prompt:
          'قم بإنشاء ملاحظة SIRP بناءً على تفاصيل اللقاء الطبي التالي:\n\nالموقف (S): وصف السبب الرئيسي للزيارة، بما في ذلك الأعراض، مدتها، والسياق المرتبط بها.\n\nالتدخل (I): تحديد الفحوصات، الاختبارات، والعلاجات التي تم إجراؤها خلال الزيارة.\n\nالاستجابة (R): توثيق استجابة المريض للتدخلات أو العلاجات الأولية.\n\nالخطة (P): تحديد الخطوات القادمة، بما في ذلك الفحوصات الإضافية، الأدوية، مواعيد المتابعة، وتعليمات المريض.',
      },
      {
        title: 'ملاحظات DAP',
        language: 'ar',
        prompt:
          'قم بإنشاء ملاحظة DAP بناءً على تفاصيل الجلسة:\n\nالبيانات (D): تلخيص الملاحظات، الأعراض التي أبلغ عنها المريض، ونتائج الاختبارات.\n\nالتقييم (A): تقديم تفسير للبيانات، بما في ذلك الانطباعات السريرية، التقدم، والمخاوف.\n\nالخطة (P): تحديد التوصيات العلاجية، خطط العلاج، مواعيد المتابعة، أو أي تعديلات على استراتيجية الرعاية.',
      },
      {
        title: 'ملاحظات BIRP',
        language: 'ar',
        prompt:
          'قم بإنشاء ملاحظة BIRP بناءً على تفاصيل اللقاء الطبي:\n\nالسلوك (B): وصف التعبيرات اللفظية وغير اللفظية للمريض، الأعراض، والملاحظات السلوكية.\n\nالتدخل (I): توثيق التدخلات العلاجية، الفحوصات، والعلاجات المقدمة.\n\nالاستجابة (R): تسجيل كيفية استجابة المريض للتدخلات.\n\nالخطة (P): تحديد خطوات المتابعة، تعديلات العلاج، وتفاصيل الزيارة القادمة.',
      },
      {
        title: 'ملاحظات تقدم العلاج النفسي',
        language: 'ar',
        prompt:
          'قم بإنشاء ملاحظة تقدم العلاج النفسي متضمنةً ما يلي:\n\nنظرة عامة على الجلسة:\nوصف التركيز الرئيسي للجلسة والقضايا الرئيسية التي تمت مناقشتها.\n\nالتدخل المستخدم:\nتحديد التقنيات العلاجية والتدخلات المطبقة أثناء الجلسة.\n\nاستجابة المريض:\nتلخيص كيفية تفاعل المريض واستجابته للجلسة.\n\nالخطة:\nتحديد التوصيات، الواجبات المنزلية، أهداف الجلسة القادمة، وخطوات المتابعة.',
      },
      {
        title: 'ملاحظات تقدم طب الأطفال',
        language: 'ar',
        prompt:
          'قم بإنشاء ملاحظة تقدم طب الأطفال بالهيكل التالي:\n\nالشكوى الرئيسية:\nتلخيص سبب الزيارة بكلمات مقدم الرعاية و/أو الطفل نفسه.\n\nتاريخ الحالة:\nتفصيل بداية الأعراض، مدتها، شدتها، وأي تدخلات تم تجربتها في المنزل.\n\nالملاحظات السلوكية والتنموية:\nتسجيل المهارات الحركية، الوظائف الإدراكية، الكلام، والاستجابات السلوكية للطفل.\n\nالتقييم:\nتقديم انطباعات تشخيصية ونتائج الفحوصات ذات الصلة.\n\nالخطة:\nتحديد خطوات العلاج، توصيات الأدوية، وجداول المتابعة.',
      },
      {
        title: 'ملخص الخروج',
        language: 'ar',
        prompt:
          'قم بإنشاء ملخص خروج يتضمن ما يلي:\n\nتفاصيل القبول:\nتضمين تاريخ القبول، سبب الاستشفاء، والتشخيص الأولي.\n\nمسار العلاج في المستشفى:\nتلخيص الأحداث الرئيسية، الفحوصات، والعلاجات المقدمة خلال الإقامة بالمستشفى.\n\nتشخيص الخروج:\nإدراج التشخيصات الأساسية والثانوية عند الخروج.\n\nالأدوية:\nتوفير قائمة الأدوية الموصوفة عند الخروج.\n\nخطة المتابعة:\nتحديد تعليمات ما بعد الخروج، مواعيد المتابعة، والتوصيات الخاصة بالرعاية.',
      },
      {
        title: 'تقرير العملية الجراحية',
        language: 'ar',
        prompt:
          'قم بإنشاء تقرير عملية جراحية متضمناً التفاصيل التالية:\n\nالتشخيص قبل الجراحة:\nإدراج الحالة (أو الحالات) التي استدعت التدخل الجراحي.\n\nالتشخيص بعد الجراحة:\nتقديم ملخص للتشخيص النهائي بعد الإجراء.\n\nالإجراء الجراحي:\nوصف التدخل الجراحي والخطوات الأساسية المتبعة.\n\nالنتائج:\nتفصيل الملاحظات التي تم تسجيلها أثناء العملية.\n\nالمضاعفات:\nتوثيق أي مشاكل أو مضاعفات حدثت أثناء العملية.\n\nالخطة:\nتحديد الرعاية بعد الجراحة، الأدوية، وتعليمات المتابعة.',
      },
      {
        title: 'تقييم الصحة النفسية',
        language: 'ar',
        prompt:
          'قم بإنشاء تقرير تقييم للصحة النفسية متضمناً الأقسام التالية:\n\nالمشكلة المطروحة:\nوصف القلق الرئيسي للمريض وأعراضه النفسية.\n\nالتاريخ النفسي:\nتلخيص التشخيصات السابقة، العلاجات، حالات الاستشفاء، وسجل الأدوية.\n\nالفحص النفسي:\nتسجيل مظهر المريض، سلوكه، مزاجه، عمليات التفكير، والوظائف الإدراكية.\n\nالتقييم:\nتقديم انطباعات تشخيصية بناءً على التقييم السريري.\n\nالخطة:\nتوصية بالعلاج، الأدوية، الإحالات، وخطوات المتابعة.',
      },
      {
        title: 'ملاحظات رعاية المسنين',
        language: 'ar',
        prompt:
          'قم بإنشاء ملاحظة رعاية المسنين متضمنةً ما يلي:\n\nالشكوى الرئيسية:\nتفصيل المخاوف الأساسية من منظور المريض أو مقدم الرعاية.\n\nالحالة الوظيفية:\nتقييم القدرة على الحركة، أنشطة الحياة اليومية، والوظائف الإدراكية.\n\nالأمراض المزمنة:\nإدراج الحالات الطبية المستمرة وحالة إدارتها الحالية.\n\nالأدوية:\nتوفير قائمة محدثة بالأدوية مع ملاحظات حول الالتزام بها.\n\nالخطة:\nتحديد التدخلات، تعليمات مقدمي الرعاية، وتوصيات المتابعة.',
      },
    ];

    if ((action as ActionType) === ActionType.Create) {
      const existingTemplates = await templateRepository.find();
      if (existingTemplates.length > 0) {
        console.log('Medical note templates already exist.');
        return;
      } else await templateRepository.save(templates);
    } else if ((action as ActionType) === 'Update') {
      for (const template of templates) {
        const existingTemplates = await templateRepository.findOne({ where: { title: template.title } });
        if (existingTemplates) {
          existingTemplates.prompt = template.prompt;
          existingTemplates.language = template.language;
          await templateRepository.save(existingTemplates);
        } else await templateRepository.save(template);
      }
    } else {
      console.log('Invalid action. Choose either "Create" or "Update".');
    }

    console.log('Templates seeded successfully.');
  }
}
