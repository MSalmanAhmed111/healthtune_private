import { DataSource, DataSourceOptions, Repository } from 'typeorm';
import { Template } from '@entities';
import { dataSourceOptions } from '../db-config';

export class MedicalNoteTemplateSeeder {
  async run(): Promise<void> {
    const dataSource = new DataSource(dataSourceOptions as DataSourceOptions);
    await dataSource.initialize();

    const templateRepository: Repository<Template> = dataSource.getRepository(Template);

    const templates = [
      {
        title: 'SOAP Notes',
        prompt:
          "Generate me SOAP Notes With the Following Sections:\n\nSubjective:\nDescribe the patient's symptoms, complaints, and medical history relevant to the visit.\n\nObjective:\nRecord measurable clinical findings, including vital signs, physical examination results, and test outcomes.\n\nAssessment:\nProvide a diagnosis or clinical impression based on subjective and objective data.\n\nPlan:\nOutline the treatment strategy, prescriptions, follow-up plans, and patient instructions.",
      },
      {
        title: 'SIRP Notes',
        prompt:
          'Generate a structured SIRP note based on the following patient encounter details:\n\nSituation (S): Describe the primary reason for the visit, including symptoms, duration, and any relevant context.\n\nIntervention (I): Outline the assessments, tests, and treatments performed during the visit.\n\nResponse (R): Document how the patient responded to interventions or initial treatments.\n\nPlan (P): Specify the next steps, including further tests, medications, follow-up appointments, and patient instructions.',
      },
      {
        title: 'DAP Notes',
        prompt:
          'Generate a structured DAP note based on the session details:\n\nData (D): Summarize observations, patient-reported symptoms, and any test results.\n\nAssessment (A): Provide an interpretation of the data, including clinical impressions, progress, and concerns.\n\nPlan (P): Outline treatment recommendations, therapy plans, follow-up visits, or any modifications to the care strategy.',
      },
      {
        title: 'BIRP Notes',
        prompt:
          'Generate a structured BIRP note based on the patient encounter details:\n\nBehavior (B): Describe the patient’s verbal and non-verbal expressions, symptoms, and behavioral observations.\n\nIntervention (I): Document the therapeutic interventions, assessments, and treatments provided.\n\nResponse (R): Record how the patient responded to the interventions.\n\nPlan (P): Outline follow-up steps, treatment adjustments, and next visit details.',
      },
      {
        title: 'Psychotherapy Progress Notes',
        prompt:
          'Generate a Psychotherapy Progress Note including the following:\n\nSession Overview:\nDescribe the main focus of the therapy session and key issues discussed.\n\nIntervention Used:\nList therapeutic techniques and interventions applied during the session.\n\nPatient Response:\nSummarize how the patient engaged and responded to the session.\n\nPlan:\nOutline recommendations, homework assignments, next session goals, and follow-up actions.',
      },
      {
        title: 'Pediatric Progress Notes',
        prompt:
          'Generate a Pediatric Progress Note with the following structure:\n\nChief Complaint:\nSummarize the reason for the visit in the caregiver’s and/or child’s own words.\n\nHistory of Present Illness:\nDetail symptom onset, duration, severity, and any interventions attempted at home.\n\nDevelopmental and Behavioral Observations:\nRecord the child’s motor skills, cognitive function, speech, and behavioral responses.\n\nAssessment:\nProvide diagnostic impressions and relevant test findings.\n\nPlan:\nOutline treatment steps, medication recommendations, and follow-up schedules.',
      },
      {
        title: 'Discharge Summary',
        prompt:
          'Generate a Discharge Summary with the following structure:\n\nAdmission Details:\nInclude admission date, reason for hospitalization, and initial diagnosis.\n\nHospital Course:\nSummarize key events, tests, and treatments provided during the hospital stay.\n\nDischarge Diagnosis:\nList primary and secondary diagnoses at discharge.\n\nMedications:\nProvide a list of medications prescribed upon discharge.\n\nFollow-up Plan:\nSpecify post-discharge instructions, follow-up appointments, and care recommendations.',
      },
      {
        title: 'Operative Report',
        prompt:
          'Generate an Operative Report including the following details:\n\nPreoperative Diagnosis:\nList the condition(s) necessitating the surgery.\n\nPostoperative Diagnosis:\nProvide a summary of the final diagnosis after the procedure.\n\nProcedure Performed:\nDescribe the surgical intervention and key steps involved.\n\nFindings:\nDetail observations made during the procedure.\n\nComplications:\nDocument any intraoperative complications or issues encountered.\n\nPlan:\nOutline post-operative care, medication, and follow-up instructions.',
      },
      {
        title: 'Mental Health Assessment',
        prompt:
          "Generate a Mental Health Assessment report with the following sections:\n\nPresenting Problem:\nDescribe the patient's primary mental health concern and symptoms.\n\nPsychiatric History:\nSummarize past diagnoses, treatments, hospitalizations, and medication history.\n\nMental Status Examination:\nRecord the patient’s appearance, behavior, mood, thought processes, and cognitive function.\n\nAssessment:\nProvide diagnostic impressions based on clinical evaluation.\n\nPlan:\nRecommend therapy, medications, referrals, and follow-up steps.",
      },
      {
        title: 'Geriatric Care Note',
        prompt:
          'Generate a Geriatric Care Note covering the following:\n\nChief Complaint:\nDetail the primary concerns from the patient or caregiver’s perspective.\n\nFunctional Status:\nAssess mobility, daily living activities, and cognitive function.\n\nChronic Conditions:\nList ongoing medical conditions and their current management status.\n\nMedications:\nProvide an updated medication list with adherence notes.\n\nPlan:\nSpecify interventions, caregiver instructions, and follow-up recommendations.',
      },
    ];

    const existingTemplates = await templateRepository.find();
    if (existingTemplates.length > 0) {
      console.log('Medical note templates already exist.');
      return;
    }

    await templateRepository.save(templates);
    console.log('Medical note templates seeded successfully.');
  }
}
