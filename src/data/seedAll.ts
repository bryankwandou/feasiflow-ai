import { usePatientStore } from '@/stores/usePatientStore';
import { useAppointmentStore } from '@/stores/useAppointmentStore';
import { useEncounterStore } from '@/stores/useEncounterStore';
import { useLabStore } from '@/stores/useLabStore';
import { usePrescriptionStore } from '@/stores/usePrescriptionStore';
import { useBillingStore } from '@/stores/useBillingStore';
import { useReferralStore } from '@/stores/useReferralStore';
import { useAgentStore } from '@/stores/useAgentStore';
import { useEducationStore } from '@/stores/useEducationStore';
import { CLINICAL_AGENTS } from './agentSeed';

export function seedAll() {
  const patientStore = usePatientStore.getState();
  const apptStore = useAppointmentStore.getState();
  const encStore = useEncounterStore.getState();
  const labStore = useLabStore.getState();
  const rxStore = usePrescriptionStore.getState();
  const billStore = useBillingStore.getState();
  const refStore = useReferralStore.getState();
  const agentStore = useAgentStore.getState();
  const eduStore = useEducationStore.getState();

  if (Object.keys(patientStore.patients).length > 0) return;

  agentStore.setAgents(CLINICAL_AGENTS);

  const p1 = patientStore.addPatient({
    firstName: 'Maria', lastName: 'Johnson', preferredName: 'Maria', dateOfBirth: '1985-03-22', gender: 'female', pronouns: 'she/her', maritalStatus: 'married', ssn: '***-**-1242',
    phone: '(951) 555-0142', phoneType: 'mobile', email: 'maria.j@email.com', preferredContact: 'phone',
    address1: '4521 Oak Street', city: 'Riverside', state: 'CA', zip: '92501',
    emergencyName: 'David Johnson', emergencyRelationship: 'spouse', emergencyPhone: '(951) 555-0143',
    insuranceCarrier: 'Blue Cross Blue Shield', insurancePlan: 'PPO', memberId: 'BCBS789012345', groupNumber: 'GRP001',
    subscriberName: 'Maria Johnson', subscriberDOB: '1985-03-22', subscriberRelationship: 'self', copay: 30, deductibleMet: 400, deductibleTotal: 1500,
    primaryProvider: 'Dr. Sarah Chen', bloodType: 'O+', preferredPharmacy: 'CVS Pharmacy #8421', language: 'English', interpreterNeeded: false,
    activeDiagnoses: [
      { code: 'E11.65', description: 'Type 2 diabetes mellitus with hyperglycemia', onsetDate: '2022-01-15' },
      { code: 'I10', description: 'Essential (primary) hypertension', onsetDate: '2021-06-10' },
      { code: 'E78.5', description: 'Hyperlipidemia, unspecified', onsetDate: '2022-01-15' }
    ],
    allergies: [
      { id: 'allergy_1', substance: 'Penicillin', allergyType: 'drug', reaction: 'Anaphylaxis', severity: 'life-threatening', status: 'active', enteredBy: 'Dr. Sarah Chen', enteredAt: Date.now() - 86400000 * 365 },
      { id: 'allergy_2', substance: 'Sulfa drugs', allergyType: 'drug', reaction: 'Rash', severity: 'moderate', status: 'active', enteredBy: 'Dr. Sarah Chen', enteredAt: Date.now() - 86400000 * 365 },
      { id: 'allergy_3', substance: 'Latex', allergyType: 'environmental', reaction: 'Contact dermatitis', severity: 'mild', status: 'active', enteredBy: 'Dr. Sarah Chen', enteredAt: Date.now() - 86400000 * 300 }
    ],
    currentMedications: [
      { id: 'med_1', medicationName: 'Metformin', genericName: 'Metformin hydrochloride', strength: '500mg', form: 'tablet', sig: 'Take 1 tablet by mouth twice daily with meals', prescribedBy: 'Dr. Sarah Chen', prescribedDate: '2024-11-28', daysSupply: 60, refillsRemaining: 5, nextRefillDate: '2025-01-27', indication: 'Type 2 Diabetes Mellitus', status: 'active', ndc: '0093-1074-01' },
      { id: 'med_2', medicationName: 'Lisinopril', genericName: 'Lisinopril', strength: '10mg', form: 'tablet', sig: 'Take 1 tablet by mouth once daily', prescribedBy: 'Dr. Sarah Chen', prescribedDate: '2024-11-28', daysSupply: 90, refillsRemaining: 5, nextRefillDate: '2025-02-26', indication: 'Hypertension', status: 'active', ndc: '0093-1058-01' },
      { id: 'med_3', medicationName: 'Atorvastatin', genericName: 'Atorvastatin calcium', strength: '20mg', form: 'tablet', sig: 'Take 1 tablet by mouth once daily in the evening', prescribedBy: 'Dr. Sarah Chen', prescribedDate: '2024-09-15', daysSupply: 90, refillsRemaining: 5, nextRefillDate: '2025-03-15', indication: 'Hyperlipidemia', status: 'active', ndc: '0071-0155-23' }
    ],
    pastSurgeries: [{ description: 'Cesarean section', date: '2015-08-12' }],
    familyHistory: [{ condition: 'Type 2 Diabetes', relationship: 'mother' }, { condition: 'Hypertension', relationship: 'father' }],
    socialHistory: { smokingStatus: 'never', alcoholUse: 'social', drinksPerWeek: 2, occupation: 'School teacher', exerciseFrequency: 'occasional', dietType: 'Standard American', livingSituation: 'Lives with spouse and 2 children', educationLevel: 'Bachelor\'s degree' },
    preventiveHealth: [
      { id: 'prev_1', name: 'Mammogram', category: 'screening', lastDone: '2023-04-10', nextDue: '2025-04-10', status: 'current' },
      { id: 'prev_2', name: 'HbA1c', category: 'screening', lastDone: '2024-12-01', nextDue: '2025-03-01', status: 'current' },
      { id: 'prev_3', name: 'Lipid panel', category: 'screening', lastDone: '2024-09-15', nextDue: '2025-09-15', status: 'current' },
      { id: 'prev_4', name: 'Colonoscopy', category: 'screening', nextDue: '2030-03-22', status: 'not-applicable' }
    ],
    status: 'active', firstVisitDate: '2022-01-15', lastVisitDate: '2024-11-28', notes: 'Diabetes management patient. Generally compliant with medications. Struggles with diet consistency.'
  });

  const p2 = patientStore.addPatient({
    firstName: 'Robert', lastName: 'Williams', dateOfBirth: '1962-08-14', gender: 'male', maritalStatus: 'married',
    phone: '(951) 555-0144', phoneType: 'home', preferredContact: 'phone',
    address1: '7823 Pine Avenue', city: 'Riverside', state: 'CA', zip: '92503',
    emergencyName: 'Karen Williams', emergencyRelationship: 'spouse', emergencyPhone: '(951) 555-0145',
    insuranceCarrier: 'Medicare', insurancePlan: 'Part B + Supplement Plan G', memberId: 'MED123456789A', groupNumber: 'N/A',
    subscriberName: 'Robert Williams', subscriberDOB: '1962-08-14', subscriberRelationship: 'self', copay: 0, deductibleMet: 2000, deductibleTotal: 2000,
    primaryProvider: 'Dr. Sarah Chen', bloodType: 'A+', preferredPharmacy: 'Walgreens #6123', language: 'English', interpreterNeeded: false,
    activeDiagnoses: [
      { code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery without angina pectoris', onsetDate: '2019-03-20' },
      { code: 'I50.32', description: 'Chronic diastolic (congestive) heart failure', onsetDate: '2021-07-15' },
      { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', onsetDate: '2018-05-10' },
      { code: 'I10', description: 'Essential (primary) hypertension', onsetDate: '2015-01-10' },
      { code: 'N18.31', description: 'Chronic kidney disease, stage 3a', onsetDate: '2020-09-22' },
      { code: 'F33.1', description: 'Major depressive disorder, recurrent, moderate', onsetDate: '2022-11-05' }
    ],
    allergies: [{ id: 'allergy_4', substance: 'NKDA', allergyType: 'other', reaction: 'No known drug allergies', severity: 'mild', status: 'active', enteredBy: 'Dr. Sarah Chen', enteredAt: Date.now() - 86400000 * 400 }],
    currentMedications: [
      { id: 'med_4', medicationName: 'Carvedilol', strength: '12.5mg', form: 'tablet', sig: 'Take 1 tablet by mouth twice daily', prescribedBy: 'Dr. Sarah Chen', prescribedDate: '2024-10-01', daysSupply: 60, refillsRemaining: 5, nextRefillDate: '2025-03-01', indication: 'Heart failure / Hypertension', status: 'active', ndc: '0093-0058-01' },
      { id: 'med_5', medicationName: 'Lisinopril', strength: '20mg', form: 'tablet', sig: 'Take 1 tablet by mouth once daily', prescribedBy: 'Dr. Sarah Chen', prescribedDate: '2024-10-01', daysSupply: 90, refillsRemaining: 5, nextRefillDate: '2025-04-01', indication: 'Heart failure / Hypertension', status: 'active', ndc: '0093-1058-02' },
      { id: 'med_6', medicationName: 'Furosemide', strength: '40mg', form: 'tablet', sig: 'Take 1 tablet by mouth once daily in the morning', prescribedBy: 'Dr. Sarah Chen', prescribedDate: '2024-10-01', daysSupply: 90, refillsRemaining: 5, nextRefillDate: '2025-04-01', indication: 'Heart failure', status: 'active', ndc: '0093-1060-01' },
      { id: 'med_7', medicationName: 'Spironolactone', strength: '25mg', form: 'tablet', sig: 'Take 1 tablet by mouth once daily', prescribedBy: 'Dr. Sarah Chen', prescribedDate: '2024-10-01', daysSupply: 90, refillsRemaining: 5, nextRefillDate: '2025-04-01', indication: 'Heart failure', status: 'active', ndc: '0093-1061-01' },
      { id: 'med_8', medicationName: 'Metformin', strength: '500mg', form: 'tablet', sig: 'Take 1 tablet by mouth once daily with dinner', prescribedBy: 'Dr. Sarah Chen', prescribedDate: '2024-10-01', daysSupply: 90, refillsRemaining: 5, nextRefillDate: '2025-04-01', indication: 'Type 2 Diabetes', status: 'active', ndc: '0093-1074-01' },
      { id: 'med_9', medicationName: 'Sertraline', strength: '100mg', form: 'tablet', sig: 'Take 1 tablet by mouth once daily', prescribedBy: 'Dr. Sarah Chen', prescribedDate: '2024-11-05', daysSupply: 90, refillsRemaining: 5, nextRefillDate: '2025-05-05', indication: 'Major depressive disorder', status: 'active', ndc: '0093-1080-01' },
      { id: 'med_10', medicationName: 'Aspirin', strength: '81mg', form: 'tablet', sig: 'Take 1 tablet by mouth once daily', prescribedBy: 'Dr. Sarah Chen', prescribedDate: '2024-10-01', daysSupply: 90, refillsRemaining: 5, nextRefillDate: '2025-04-01', indication: 'Cardiovascular disease prevention', status: 'active', ndc: '0093-1081-01' },
      { id: 'med_11', medicationName: 'Atorvastatin', strength: '40mg', form: 'tablet', sig: 'Take 1 tablet by mouth once daily in the evening', prescribedBy: 'Dr. Sarah Chen', prescribedDate: '2024-10-01', daysSupply: 90, refillsRemaining: 5, nextRefillDate: '2025-04-01', indication: 'Hyperlipidemia / CAD', status: 'active', ndc: '0071-0155-24' },
      { id: 'med_12', medicationName: 'Empagliflozin', strength: '10mg', form: 'tablet', sig: 'Take 1 tablet by mouth once daily in the morning', prescribedBy: 'Dr. Sarah Chen', prescribedDate: '2024-10-01', daysSupply: 90, refillsRemaining: 5, nextRefillDate: '2025-04-01', indication: 'Heart failure with preserved ejection fraction / Type 2 diabetes', status: 'active', ndc: '00078-0568-15' }
    ],
    pastSurgeries: [{ description: 'Coronary artery stent placement', date: '2019-03-25' }],
    familyHistory: [{ condition: 'Coronary artery disease', relationship: 'father' }, { condition: 'Hypertension', relationship: 'mother' }],
    socialHistory: { smokingStatus: 'former', packYears: 30, quitDate: '2018-01-15', alcoholUse: 'none', occupation: 'Retired auto worker', exerciseFrequency: 'none', dietType: 'Standard', livingSituation: 'Lives with spouse' },
    preventiveHealth: [
      { id: 'prev_5', name: 'Influenza vaccine', category: 'immunization', lastDone: '2024-10-15', nextDue: '2025-10-15', status: 'current' },
      { id: 'prev_6', name: 'Pneumococcal vaccine', category: 'immunization', lastDone: '2023-09-10', nextDue: '2025-09-10', status: 'current' },
      { id: 'prev_7', name: 'Colonoscopy', category: 'screening', lastDone: '2022-06-15', nextDue: '2032-06-15', status: 'current' }
    ],
    status: 'active', firstVisitDate: '2015-01-10', lastVisitDate: '2024-12-12', notes: 'Complex cardiac patient. Monitor daily weights. Fluid restriction 1500mL/day.'
  });

  const p3 = patientStore.addPatient({
    firstName: 'Elena', lastName: 'Garcia', dateOfBirth: '1989-04-07', gender: 'female', maritalStatus: 'single', preferredContact: 'phone',
    phone: '(951) 555-0146', phoneType: 'mobile', language: 'Spanish', interpreterNeeded: true,
    address1: '1245 Maple Drive', city: 'Riverside', state: 'CA', zip: '92504',
    emergencyName: 'Carlos Garcia', emergencyRelationship: 'brother', emergencyPhone: '(951) 555-0147',
    insuranceCarrier: 'Medi-Cal', insurancePlan: 'Medicaid', memberId: 'MC456789012', groupNumber: 'CA-MEDI',
    subscriberName: 'Elena Garcia', subscriberDOB: '1989-04-07', subscriberRelationship: 'self', copay: 0,
    primaryProvider: 'Dr. James Patel', bloodType: 'B+', preferredPharmacy: 'Rite Aid #4521',
    activeDiagnoses: [
      { code: 'J45.31', description: 'Mild persistent asthma, acute exacerbation', onsetDate: '2024-12-10' },
      { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', onsetDate: '2023-02-15' },
      { code: 'G43.909', description: 'Migraine, unspecified, not intractable', onsetDate: '2020-05-20' }
    ],
    allergies: [
      { id: 'allergy_5', substance: 'Ibuprofen', allergyType: 'drug', reaction: 'GI bleeding', severity: 'severe', status: 'active', enteredBy: 'Dr. James Patel', enteredAt: Date.now() - 86400000 * 200 },
      { id: 'allergy_6', substance: 'Codeine', allergyType: 'drug', reaction: 'Nausea/vomiting', severity: 'moderate', status: 'active', enteredBy: 'Dr. James Patel', enteredAt: Date.now() - 86400000 * 200 }
    ],
    currentMedications: [
      { id: 'med_13', medicationName: 'Albuterol HFA', strength: '90mcg', form: 'inhaler', sig: '1-2 puffs by mouth every 4-6 hours as needed for shortness of breath', prescribedBy: 'Dr. James Patel', prescribedDate: '2024-12-10', daysSupply: 30, refillsRemaining: 5, nextRefillDate: '2025-01-10', indication: 'Asthma rescue', status: 'active', ndc: '0093-1172-01' },
      { id: 'med_14', medicationName: 'Fluticasone/Salmeterol', strength: '100/50mcg', form: 'inhaler', sig: '1 puff by mouth twice daily', prescribedBy: 'Dr. James Patel', prescribedDate: '2024-12-10', daysSupply: 60, refillsRemaining: 5, nextRefillDate: '2025-02-10', indication: 'Asthma maintenance', status: 'active', ndc: '0093-1173-01' },
      { id: 'med_15', medicationName: 'Metformin', strength: '1000mg', form: 'tablet', sig: 'Take 1 tablet by mouth twice daily with meals', prescribedBy: 'Dr. James Patel', prescribedDate: '2024-09-01', daysSupply: 60, refillsRemaining: 5, nextRefillDate: '2025-03-01', indication: 'Type 2 Diabetes', status: 'active', ndc: '0093-1074-02' },
      { id: 'med_16', medicationName: 'Sumatriptan', strength: '50mg', form: 'tablet', sig: 'Take 1 tablet by mouth at onset of migraine, may repeat once after 2 hours if needed, max 2 tablets per day', prescribedBy: 'Dr. James Patel', prescribedDate: '2024-06-15', daysSupply: 18, refillsRemaining: 5, nextRefillDate: '2025-01-15', indication: 'Migraine', status: 'active', ndc: '0093-1180-01' }
    ],
    pastSurgeries: [], familyHistory: [{ condition: 'Asthma', relationship: 'mother' }],
    socialHistory: { smokingStatus: 'never', alcoholUse: 'none', occupation: 'Office assistant', exerciseFrequency: 'occasional', dietType: 'Mexican traditional', livingSituation: 'Lives with parents' },
    preventiveHealth: [
      { id: 'prev_8', name: 'Cervical cancer screening', category: 'screening', lastDone: '2021-05-10', nextDue: '2024-05-10', status: 'overdue' },
      { id: 'prev_9', name: 'HbA1c', category: 'screening', lastDone: '2024-11-01', nextDue: '2025-02-01', status: 'current' }
    ],
    status: 'active', firstVisitDate: '2020-05-20', lastVisitDate: '2024-12-10', notes: 'Spanish-speaking patient. Interpreter needed for complex discussions. Asthma control generally good but recent exacerbation.'
  });

  const p4 = patientStore.addPatient({
    firstName: 'Li', lastName: 'Chen', preferredName: 'Thomas', dateOfBirth: '1953-01-30', gender: 'male', maritalStatus: 'married',
    phone: '(951) 555-0148', phoneType: 'home', preferredContact: 'phone', language: 'English', interpreterNeeded: false,
    address1: '3890 Birch Lane', city: 'Riverside', state: 'CA', zip: '92505',
    emergencyName: 'Mei Chen', emergencyRelationship: 'spouse', emergencyPhone: '(951) 555-0149',
    insuranceCarrier: 'Medicare', insurancePlan: 'Kaiser Supplement', memberId: 'KP987654321', groupNumber: 'KP-SUPP',
    subscriberName: 'Li Chen', subscriberDOB: '1953-01-30', subscriberRelationship: 'self', copay: 0,
    primaryProvider: 'Dr. Sarah Chen', bloodType: 'AB-', preferredPharmacy: 'Kaiser Permanente Pharmacy',
    activeDiagnoses: [
      { code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery without angina pectoris', onsetDate: '2018-04-10' },
      { code: 'I10', description: 'Essential (primary) hypertension', onsetDate: '2010-02-15' },
      { code: 'E78.5', description: 'Hyperlipidemia, unspecified', onsetDate: '2015-06-20' },
      { code: 'M16.11', description: 'Osteoarthritis of right hip', onsetDate: '2020-08-15' },
      { code: 'K57.30', description: 'Diverticulosis of large intestine without perforation or abscess without bleeding', onsetDate: '2019-11-10' },
      { code: 'J44.1', description: 'Chronic obstructive pulmonary disease with acute exacerbation', onsetDate: '2024-11-20' },
      { code: 'E03.9', description: 'Hypothyroidism, unspecified', onsetDate: '2012-03-05' }
    ],
    allergies: [
      { id: 'allergy_7', substance: 'Cephalexin', allergyType: 'drug', reaction: 'Rash', severity: 'moderate', status: 'active', enteredBy: 'Dr. Sarah Chen', enteredAt: Date.now() - 86400000 * 500 },
      { id: 'allergy_8', substance: 'Fluoroquinolones', allergyType: 'drug', reaction: 'Tendon rupture history', severity: 'severe', status: 'active', enteredBy: 'Dr. Sarah Chen', enteredAt: Date.now() - 86400000 * 500 }
    ],
    currentMedications: [
      { id: 'med_17', medicationName: 'Metoprolol succinate', strength: '50mg', form: 'tablet', sig: 'Take 1 tablet by mouth once daily', prescribedBy: 'Dr. Sarah Chen', prescribedDate: '2024-10-01', daysSupply: 90, refillsRemaining: 5, nextRefillDate: '2025-04-01', indication: 'Hypertension / CAD', status: 'active', ndc: '0093-1175-01' },
      { id: 'med_18', medicationName: 'Amlodipine', strength: '10mg', form: 'tablet', sig: 'Take 1 tablet by mouth once daily', prescribedBy: 'Dr. Sarah Chen', prescribedDate: '2024-10-01', daysSupply: 90, refillsRemaining: 5, nextRefillDate: '2025-04-01', indication: 'Hypertension', status: 'active', ndc: '0093-1176-01' },
      { id: 'med_19', medicationName: 'Atorvastatin', strength: '80mg', form: 'tablet', sig: 'Take 1 tablet by mouth once daily in the evening', prescribedBy: 'Dr. Sarah Chen', prescribedDate: '2024-10-01', daysSupply: 90, refillsRemaining: 5, nextRefillDate: '2025-04-01', indication: 'Hyperlipidemia / CAD', status: 'active', ndc: '0071-0155-25' },
      { id: 'med_20', medicationName: 'Aspirin', strength: '81mg', form: 'tablet', sig: 'Take 1 tablet by mouth once daily', prescribedBy: 'Dr. Sarah Chen', prescribedDate: '2024-10-01', daysSupply: 90, refillsRemaining: 5, nextRefillDate: '2025-04-01', indication: 'CAD prevention', status: 'active', ndc: '0093-1081-01' },
      { id: 'med_21', medicationName: 'Tiotropium', strength: '18mcg', form: 'inhaler', sig: 'Inhale 1 capsule contents once daily using HandiHaler', prescribedBy: 'Dr. Sarah Chen', prescribedDate: '2024-11-20', daysSupply: 30, refillsRemaining: 5, nextRefillDate: '2025-01-20', indication: 'COPD', status: 'active', ndc: '0093-1177-01' },
      { id: 'med_22', medicationName: 'Levothyroxine', strength: '75mcg', form: 'tablet', sig: 'Take 1 tablet by mouth once daily in the morning on empty stomach, 30 minutes before breakfast', prescribedBy: 'Dr. Sarah Chen', prescribedDate: '2024-10-01', daysSupply: 90, refillsRemaining: 5, nextRefillDate: '2025-04-01', indication: 'Hypothyroidism', status: 'active', ndc: '0093-1178-01' }
    ],
    pastSurgeries: [{ description: 'Right hip replacement', date: '2021-03-15' }],
    familyHistory: [{ condition: 'Hypertension', relationship: 'father' }, { condition: 'Stroke', relationship: 'mother' }],
    socialHistory: { smokingStatus: 'former', packYears: 20, quitDate: '2010-05-01', alcoholUse: 'social', drinksPerWeek: 1, occupation: 'Retired engineer', exerciseFrequency: 'regular', dietType: 'Asian traditional', livingSituation: 'Lives with spouse' },
    preventiveHealth: [
      { id: 'prev_10', name: 'Influenza vaccine', category: 'immunization', lastDone: '2024-10-20', nextDue: '2025-10-20', status: 'current' },
      { id: 'prev_11', name: 'Colonoscopy', category: 'screening', lastDone: '2022-05-10', nextDue: '2032-05-10', status: 'current' },
      { id: 'prev_12', name: 'Lung cancer screening', category: 'screening', nextDue: '2025-01-30', status: 'current' }
    ],
    status: 'active', firstVisitDate: '2010-02-15', lastVisitDate: '2024-12-05', notes: 'Multiple comorbidities. Annual physical upcoming. COPD exacerbation recently resolved.'
  });

  const p5 = patientStore.addPatient({
    firstName: 'Jennifer', lastName: 'Kim', dateOfBirth: '1996-09-15', gender: 'female', maritalStatus: 'single', preferredContact: 'email',
    phone: '(951) 555-0150', phoneType: 'mobile', email: 'jen.kim@email.com', language: 'English', interpreterNeeded: false,
    address1: '5678 Cedar Court', city: 'Riverside', state: 'CA', zip: '92506',
    emergencyName: 'Michael Kim', emergencyRelationship: 'father', emergencyPhone: '(951) 555-0151',
    insuranceCarrier: 'Anthem Blue Cross', insurancePlan: 'HMO', memberId: 'ANT123456789', groupNumber: 'GRP-ANT-001',
    subscriberName: 'Jennifer Kim', subscriberDOB: '1996-09-15', subscriberRelationship: 'self', copay: 20,
    primaryProvider: 'Dr. James Patel', bloodType: 'O-', preferredPharmacy: 'CVS Pharmacy #8421',
    activeDiagnoses: [
      { code: 'F32.1', description: 'Major depressive disorder, single episode, moderate', onsetDate: '2023-08-15' },
      { code: 'F40.10', description: 'Social anxiety disorder', onsetDate: '2022-03-10' },
      { code: 'G47.00', description: 'Insomnia, unspecified', onsetDate: '2023-01-20' }
    ],
    allergies: [{ id: 'allergy_9', substance: 'NKDA', allergyType: 'other', reaction: 'No known drug allergies', severity: 'mild', status: 'active', enteredBy: 'Dr. James Patel', enteredAt: Date.now() - 86400000 * 300 }],
    currentMedications: [
      { id: 'med_23', medicationName: 'Escitalopram', strength: '10mg', form: 'tablet', sig: 'Take 1 tablet by mouth once daily', prescribedBy: 'Dr. James Patel', prescribedDate: '2024-09-15', daysSupply: 90, refillsRemaining: 5, nextRefillDate: '2025-03-15', indication: 'Major depressive disorder', status: 'active', ndc: '0093-1181-01' },
      { id: 'med_24', medicationName: 'Hydroxyzine', strength: '25mg', form: 'tablet', sig: 'Take 1 tablet by mouth at bedtime as needed for anxiety', prescribedBy: 'Dr. James Patel', prescribedDate: '2024-09-15', daysSupply: 30, refillsRemaining: 5, nextRefillDate: '2025-01-15', indication: 'Anxiety / Insomnia', status: 'active', ndc: '0093-1182-01' }
    ],
    pastSurgeries: [], familyHistory: [{ condition: 'Depression', relationship: 'mother' }],
    socialHistory: { smokingStatus: 'never', alcoholUse: 'social', drinksPerWeek: 1, occupation: 'Graphic designer', exerciseFrequency: 'regular', dietType: 'Vegetarian', livingSituation: 'Lives with roommate' },
    preventiveHealth: [
      { id: 'prev_13', name: 'Cervical cancer screening', category: 'screening', lastDone: '2021-04-15', nextDue: '2024-04-15', status: 'overdue' },
      { id: 'prev_14', name: 'Hepatitis B vaccine', category: 'immunization', lastDone: '2023-06-01', nextDue: '2023-12-01', status: 'overdue' }
    ],
    status: 'active', firstVisitDate: '2022-03-10', lastVisitDate: '2024-12-10', notes: 'Young adult with mental health focus. Recently reported fatigue and weight changes — thyroid evaluation pending.'
  });

  // Appointments for today (2024-12-12)
  const a1 = apptStore.addAppointment({ patientId: p1, patientName: 'Johnson, Maria', providerId: 'prov_1', providerName: 'Dr. Sarah Chen', appointmentType: 'follow-up', appointmentTypeLabel: 'Follow-up', status: 'arrived', scheduledDate: '2024-12-12', scheduledTime: '08:30', durationMinutes: 30, roomNumber: '2', chiefComplaint: 'Diabetes follow-up', visitReason: 'Follow-up for Type 2 diabetes with increased thirst and fatigue', isFirstVisit: false, isUrgent: false, telehealth: false, confirmationSent: true, reminderSent: true, intakeForms: true, insuranceVerified: true, copayAmount: 30, followUpNeeded: false, followUpScheduled: false, notes: '', checkedInAt: Date.now() - 3600000 });
  const a2 = apptStore.addAppointment({ patientId: p2, patientName: 'Williams, Robert', providerId: 'prov_1', providerName: 'Dr. Sarah Chen', appointmentType: 'follow-up', appointmentTypeLabel: 'Heart Failure Follow-up', status: 'in-progress', scheduledDate: '2024-12-12', scheduledTime: '09:00', durationMinutes: 45, roomNumber: '4', chiefComplaint: 'Heart failure follow-up', visitReason: 'Mild increased shortness of breath past 2 days, weight up 4 lbs', isFirstVisit: false, isUrgent: false, telehealth: false, confirmationSent: true, reminderSent: true, intakeForms: true, insuranceVerified: true, copayAmount: 0, followUpNeeded: true, followUpInterval: '2 weeks', followUpScheduled: false, notes: '', checkedInAt: Date.now() - 7200000, roomAssignedAt: Date.now() - 5400000 });
  const a3 = apptStore.addAppointment({ patientId: p3, patientName: 'Garcia, Elena', providerId: 'prov_2', providerName: 'Dr. James Patel', appointmentType: 'follow-up', appointmentTypeLabel: 'Asthma Recheck', status: 'scheduled', scheduledDate: '2024-12-12', scheduledTime: '09:30', durationMinutes: 30, roomNumber: '1', chiefComplaint: 'Asthma recheck', visitReason: 'Follow-up after recent asthma exacerbation', isFirstVisit: false, isUrgent: false, telehealth: false, confirmationSent: true, reminderSent: true, intakeForms: true, insuranceVerified: true, copayAmount: 0, followUpNeeded: false, followUpScheduled: false, notes: '' });
  const a4 = apptStore.addAppointment({ patientId: p4, patientName: 'Chen, Li (Thomas)', providerId: 'prov_1', providerName: 'Dr. Sarah Chen', appointmentType: 'lab-review', appointmentTypeLabel: 'Lab Review', status: 'scheduled', scheduledDate: '2024-12-12', scheduledTime: '10:00', durationMinutes: 20, roomNumber: '3', chiefComplaint: 'Lab review', visitReason: 'Review recent lab results and adjust medications', isFirstVisit: false, isUrgent: false, telehealth: false, confirmationSent: true, reminderSent: true, intakeForms: true, insuranceVerified: true, copayAmount: 0, followUpNeeded: false, followUpScheduled: false, notes: '' });
  const a5 = apptStore.addAppointment({ patientId: p5, patientName: 'Kim, Jennifer', providerId: 'prov_2', providerName: 'Dr. James Patel', appointmentType: 'new-patient', appointmentTypeLabel: 'New Patient Evaluation', status: 'scheduled', scheduledDate: '2024-12-12', scheduledTime: '10:30', durationMinutes: 45, roomNumber: '1', chiefComplaint: 'Fatigue and weight changes', visitReason: 'New patient evaluation for persistent fatigue, weight gain, and mood changes', isFirstVisit: true, isUrgent: false, telehealth: false, confirmationSent: true, reminderSent: true, intakeForms: false, insuranceVerified: true, copayAmount: 20, followUpNeeded: false, followUpScheduled: false, notes: '' });

  // Encounters
  const e1 = encStore.createEncounter({ patientId: p1, patientName: 'Johnson, Maria', providerId: 'prov_1', providerName: 'Dr. Sarah Chen', encounterType: 'office-visit', status: 'signed', encounterDate: '2024-11-28', encounterTime: '09:15', durationMinutes: 30, chiefComplaint: 'Diabetes follow-up with complaints of increased thirst and fatigue', visitReason: 'Follow-up for Type 2 diabetes mellitus. Patient reports increased thirst and fatigue over past 4-6 weeks. Home glucose readings 180-230 mg/dL.', vitalSigns: { bloodPressureSystolic: 132, bloodPressureDiastolic: 84, heartRate: 76, respiratoryRate: 16, temperature: 98.4, temperatureRoute: 'oral', oxygenSaturation: 99, weight: 166, height: 66, bmi: 26.8, pain: 0, recordedAt: Date.now() - 86400000 * 14, recordedBy: 'Dr. Sarah Chen' }, claimId: 'claim_1', totalCharges: 185 });
  encStore.updateSOAP(e1, { chiefComplaint: 'Diabetes follow-up with complaints of increased thirst and fatigue', historyOfPresentIllness: 'Ms. Johnson is a 39-year-old female with Type 2 diabetes mellitus who presents for follow-up. She reports increased thirst and polyuria over the past 4-6 weeks. Home glucose readings have been elevated at 180-230 mg/dL. She denies infections or dietary changes. She states medication compliance is good.', reviewOfSystems: `Constitutional: Positive for fatigue. Negative for fever, chills.
Cardiovascular: Negative for chest pain, palpitations, edema.
Respiratory: Negative for dyspnea, cough.
GI: Negative for nausea, vomiting, diarrhea.
GU: Positive for polyuria.
Neuro: Negative for numbness, tingling.
Skin: Negative for wounds, infections.`, currentMedications: 'Metformin 500mg daily, Lisinopril 10mg daily, Atorvastatin 20mg daily', allergies: 'Penicillin (anaphylaxis), Sulfa drugs (rash), Latex (contact dermatitis)', socialHistory: 'Never smoker. Social alcohol use. School teacher. Occasional exercise.', familyHistory: 'Mother: Type 2 diabetes. Father: Hypertension.', vitalSigns: 'BP 132/84, HR 76, RR 16, Temp 98.4°F oral, SpO2 99%, Wt 166 lbs, BMI 26.8, Pain 0/10', physicalExamination: `General: Well-appearing, alert and oriented, no acute distress.
HEENT: Pupils equal, round, reactive. Oropharynx clear.
Neck: No JVD, no lymphadenopathy.
Cardiovascular: Regular rate and rhythm, no murmurs.
Pulmonary: Clear to auscultation bilaterally.
Abdomen: Soft, non-tender, non-distended.
Extremities: No edema, pulses intact.
Skin: No rashes, no diabetic ulcers.`, diagnosticResults: 'HbA1c 7.8% (elevated, target <7.0%). CMP within normal limits except glucose 142 mg/dL. Lipid panel: LDL 118 mg/dL (elevated, target <100).', diagnoses: [{ id: 'dx1', icd10Code: 'E11.65', icd10Description: 'Type 2 diabetes mellitus with hyperglycemia', diagnosisType: 'primary', chronic: true, newDiagnosis: false, presentingProblem: true }, { id: 'dx2', icd10Code: 'I10', icd10Description: 'Essential (primary) hypertension', diagnosisType: 'secondary', chronic: true, newDiagnosis: false, presentingProblem: false }, { id: 'dx3', icd10Code: 'E78.5', icd10Description: 'Hyperlipidemia, unspecified', diagnosisType: 'comorbidity', chronic: true, newDiagnosis: false, presentingProblem: false }], clinicalImpression: '39-year-old female with Type 2 diabetes mellitus with suboptimal glycemic control (HbA1c 7.8%). Contributing factors may include inadequate metformin dosing. Hypertension and hyperlipidemia are stable.', medications: 'Increased Metformin from 500mg daily to 500mg BID. Continue Lisinopril 10mg daily. Continue Atorvastatin 20mg daily.', orders: 'CMP, HbA1c, Lipid panel in 3 months. Annual eye exam referral.', referrals: 'Ophthalmology for annual diabetic eye exam.', patientEducation: 'Counseled on importance of medication compliance, dietary carbohydrate management, and regular exercise. Provided diabetes education handout.', followUp: 'Return in 3 months for lab review and medication adjustment.', additionalInstructions: 'Monitor home glucose daily. Contact office if glucose consistently >250 mg/dL or if symptoms of hyperglycemia worsen.', aiGenerated: true, aiGeneratedSections: ['historyOfPresentIllness', 'reviewOfSystems', 'physicalExamination', 'clinicalImpression', 'medications', 'orders', 'referrals', 'patientEducation', 'followUp', 'additionalInstructions'], providerEdited: true, lastEditedBy: 'Dr. Sarah Chen', lastEditedAt: Date.now() - 86400000 * 14 });
  encStore.addDiagnosis(e1, { id: 'dx1', icd10Code: 'E11.65', icd10Description: 'Type 2 diabetes mellitus with hyperglycemia', diagnosisType: 'primary', chronic: true, newDiagnosis: false, presentingProblem: true });
  encStore.addCPT(e1, { id: 'cpt1', cptCode: '99213', cptDescription: 'Office/outpatient visit, established patient, low complexity', units: 1, fee: 185, aiSuggested: true, providerApproved: true });

  const e2 = encStore.createEncounter({ patientId: p2, patientName: 'Williams, Robert', providerId: 'prov_1', providerName: 'Dr. Sarah Chen', status: 'in-progress', encounterDate: '2024-12-12', encounterTime: '09:00', durationMinutes: 45, chiefComplaint: 'Mild increased shortness of breath past 2 days, weight up', visitReason: 'Heart failure follow-up. Patient reports mild increased SOB with exertion over past 2 days. Daily weight log shows 4 lb increase since last visit.', vitalSigns: { bloodPressureSystolic: 118, bloodPressureDiastolic: 72, heartRate: 68, respiratoryRate: 18, temperature: 98.2, temperatureRoute: 'oral', oxygenSaturation: 96, weight: 186, height: 70, bmi: 26.7, pain: 0, recordedAt: Date.now() - 7200000, recordedBy: 'Dr. Sarah Chen' }, encounterType: 'office-visit' });

  // Lab Results
  const l1 = labStore.addResult({ patientId: p1, patientName: 'Johnson, Maria', encounterId: e1, testPanel: 'Comprehensive Metabolic Panel', orderingProvider: 'Dr. Sarah Chen', orderedDate: '2024-12-01', collectedDate: '2024-12-01', resultDate: '2024-12-01', lab: 'Quest Diagnostics', components: [
    { id: 'lc1', testName: 'Sodium', value: '140', unit: 'mEq/L', referenceRangeLow: 136, referenceRangeHigh: 145, valueStatus: 'normal' },
    { id: 'lc2', testName: 'Potassium', value: '4.1', unit: 'mEq/L', referenceRangeLow: 3.5, referenceRangeHigh: 5.1, valueStatus: 'normal' },
    { id: 'lc3', testName: 'Chloride', value: '102', unit: 'mEq/L', referenceRangeLow: 98, referenceRangeHigh: 107, valueStatus: 'normal' },
    { id: 'lc4', testName: 'CO2', value: '24', unit: 'mEq/L', referenceRangeLow: 22, referenceRangeHigh: 29, valueStatus: 'normal' },
    { id: 'lc5', testName: 'BUN', value: '14', unit: 'mg/dL', referenceRangeLow: 7, referenceRangeHigh: 25, valueStatus: 'normal' },
    { id: 'lc6', testName: 'Creatinine', value: '0.9', unit: 'mg/dL', referenceRangeLow: 0.5, referenceRangeHigh: 1.1, valueStatus: 'normal' },
    { id: 'lc7', testName: 'Glucose', value: '142', unit: 'mg/dL', referenceRangeLow: 70, referenceRangeHigh: 99, valueStatus: 'high' },
    { id: 'lc8', testName: 'Calcium', value: '9.4', unit: 'mg/dL', referenceRangeLow: 8.6, referenceRangeHigh: 10.3, valueStatus: 'normal' },
    { id: 'lc9', testName: 'Albumin', value: '4.1', unit: 'g/dL', referenceRangeLow: 3.5, referenceRangeHigh: 5.0, valueStatus: 'normal' }
  ], status: 'reviewed', reviewedBy: 'Dr. Sarah Chen', reviewedAt: Date.now() - 86400000 * 10, reportedAt: Date.now() - 86400000 * 10 });

  const l2 = labStore.addResult({ patientId: p1, patientName: 'Johnson, Maria', encounterId: e1, testPanel: 'HbA1c', orderingProvider: 'Dr. Sarah Chen', orderedDate: '2024-12-01', collectedDate: '2024-12-01', resultDate: '2024-12-01', lab: 'Quest Diagnostics', components: [
    { id: 'lc10', testName: 'HbA1c', value: '7.8', unit: '%', referenceRangeLow: 4.0, referenceRangeHigh: 5.7, valueStatus: 'high' }
  ], status: 'reviewed', reviewedBy: 'Dr. Sarah Chen', reviewedAt: Date.now() - 86400000 * 10, reportedAt: Date.now() - 86400000 * 10 });

  const l3 = labStore.addResult({ patientId: p2, patientName: 'Williams, Robert', testPanel: 'Comprehensive Metabolic Panel', orderingProvider: 'Dr. Sarah Chen', orderedDate: '2024-12-12', collectedDate: '2024-12-12', resultDate: '2024-12-12', lab: 'Quest Diagnostics', components: [
    { id: 'lc11', testName: 'Sodium', value: '138', unit: 'mEq/L', referenceRangeLow: 136, referenceRangeHigh: 145, valueStatus: 'normal' },
    { id: 'lc12', testName: 'Potassium', value: '5.4', unit: 'mEq/L', referenceRangeLow: 3.5, referenceRangeHigh: 5.1, valueStatus: 'high' },
    { id: 'lc13', testName: 'Chloride', value: '100', unit: 'mEq/L', referenceRangeLow: 98, referenceRangeHigh: 107, valueStatus: 'normal' },
    { id: 'lc14', testName: 'CO2', value: '24', unit: 'mEq/L', referenceRangeLow: 22, referenceRangeHigh: 29, valueStatus: 'normal' },
    { id: 'lc15', testName: 'BUN', value: '28', unit: 'mg/dL', referenceRangeLow: 7, referenceRangeHigh: 25, valueStatus: 'high' },
    { id: 'lc16', testName: 'Creatinine', value: '1.8', unit: 'mg/dL', referenceRangeLow: 0.7, referenceRangeHigh: 1.2, valueStatus: 'high' },
    { id: 'lc17', testName: 'Glucose', value: '156', unit: 'mg/dL', referenceRangeLow: 70, referenceRangeHigh: 99, valueStatus: 'high' },
    { id: 'lc18', testName: 'Calcium', value: '9.1', unit: 'mg/dL', referenceRangeLow: 8.6, referenceRangeHigh: 10.3, valueStatus: 'normal' },
    { id: 'lc19', testName: 'Albumin', value: '3.8', unit: 'g/dL', referenceRangeLow: 3.5, referenceRangeHigh: 5.0, valueStatus: 'normal' }
  ], status: 'resulted', reportedAt: Date.now() - 3600000 });

  const l4 = labStore.addResult({ patientId: p2, patientName: 'Williams, Robert', testPanel: 'BNP', orderingProvider: 'Dr. Sarah Chen', orderedDate: '2024-12-12', collectedDate: '2024-12-12', resultDate: '2024-12-12', lab: 'Quest Diagnostics', components: [
    { id: 'lc20', testName: 'BNP', value: '820', unit: 'pg/mL', referenceRangeLow: 0, referenceRangeHigh: 100, criticalHigh: 400, valueStatus: 'critical-high' }
  ], status: 'resulted', reportedAt: Date.now() - 3600000 });

  // Prescriptions
  rxStore.addPrescription({ patientId: p1, patientName: 'Johnson, Maria', prescriberId: 'prov_1', prescriberName: 'Dr. Sarah Chen', prescriberNPI: '1234567890', medicationName: 'Metformin', genericName: 'Metformin hydrochloride', ndc: '0093-1074-01', strength: '500mg', dosageForm: 'tablet', sig: 'Take 1 tablet by mouth twice daily with meals', quantity: 60, unit: 'tablets', daysSupply: 30, refills: 5, indication: 'Type 2 Diabetes Mellitus', icd10Code: 'E11.9', substituteGeneric: true, isControlled: false, priorAuthRequired: false, pharmacyName: 'CVS Pharmacy #8421', status: 'filled', writtenDate: '2024-11-28', expirationDate: '2025-11-28', lastFillDate: '2024-11-28', nextRefillDate: '2025-01-27' });
  rxStore.addPrescription({ patientId: p1, patientName: 'Johnson, Maria', prescriberId: 'prov_1', prescriberName: 'Dr. Sarah Chen', prescriberNPI: '1234567890', medicationName: 'Lisinopril', genericName: 'Lisinopril', ndc: '0093-1058-01', strength: '10mg', dosageForm: 'tablet', sig: 'Take 1 tablet by mouth once daily', quantity: 90, unit: 'tablets', daysSupply: 90, refills: 5, indication: 'Hypertension', icd10Code: 'I10', substituteGeneric: true, isControlled: false, priorAuthRequired: false, pharmacyName: 'CVS Pharmacy #8421', status: 'filled', writtenDate: '2024-11-28', expirationDate: '2025-11-28', lastFillDate: '2024-11-28', nextRefillDate: '2025-02-26' });

  // Claims
  billStore.addClaim({ patientId: p1, patientName: 'Johnson, Maria', encounterId: e1, providerId: 'prov_1', providerNPI: '1234567890', providerName: 'Dr. Sarah Chen', practiceNPI: '9876543210', practiceName: 'Riverside Family Medicine', insuranceCarrier: 'Blue Cross Blue Shield', memberId: 'BCBS789012345', groupNumber: 'GRP001', subscriberName: 'Maria Johnson', subscriberDOB: '1985-03-22', dateOfService: '2024-11-28', icd10Codes: ['E11.65', 'I10', 'E78.5'], serviceLines: [{ id: 'sl1', cptCode: '99213', description: 'Office visit, established patient, low complexity', dateOfService: '2024-11-28', units: 1, chargeAmount: 185, icd10Pointer: 'A', placeOfService: '11' }], totalCharges: 185, insurancePayment: 150, patientResponsibility: 30, adjustments: 5, balance: 0, status: 'paid', paidAt: Date.now() - 86400000 * 5, notes: '' });
  billStore.addClaim({ patientId: p2, patientName: 'Williams, Robert', encounterId: e2, providerId: 'prov_1', providerNPI: '1234567890', providerName: 'Dr. Sarah Chen', practiceNPI: '9876543210', practiceName: 'Riverside Family Medicine', insuranceCarrier: 'Medicare', memberId: 'MED123456789A', groupNumber: 'N/A', subscriberName: 'Robert Williams', subscriberDOB: '1962-08-14', dateOfService: '2024-11-15', icd10Codes: ['I50.32', 'I25.10', 'E11.9'], serviceLines: [{ id: 'sl2', cptCode: '99214', description: 'Office visit, established patient, moderate complexity', dateOfService: '2024-11-15', units: 1, chargeAmount: 285, icd10Pointer: 'A', placeOfService: '11' }], totalCharges: 285, balance: 285, status: 'denied', denialReason: 'Medical necessity not established', denialCode: 'CO-50', appealDeadline: '2025-05-15', notes: '' });
  billStore.addClaim({ patientId: p2, patientName: 'Williams, Robert', encounterId: 'enc_dummy', providerId: 'prov_1', providerNPI: '1234567890', providerName: 'Dr. Sarah Chen', practiceNPI: '9876543210', practiceName: 'Riverside Family Medicine', insuranceCarrier: 'Medicare', memberId: 'MED123456789A', groupNumber: 'N/A', subscriberName: 'Robert Williams', subscriberDOB: '1962-08-14', dateOfService: '2024-11-22', icd10Codes: ['I50.32'], serviceLines: [{ id: 'sl3', cptCode: '99213', description: 'Office visit, established patient, low complexity', dateOfService: '2024-11-22', units: 1, chargeAmount: 185, icd10Pointer: 'A', placeOfService: '11' }], totalCharges: 185, balance: 185, status: 'denied', denialReason: 'Diagnosis does not match procedure code', denialCode: 'CO-11', appealDeadline: '2025-05-22', notes: '' });

  // Referrals
  refStore.addReferral({ patientId: p2, patientName: 'Williams, Robert', patientDOB: '1962-08-14', patientInsurance: 'Medicare', patientMemberId: 'MED123456789A', referringProvider: 'Dr. Sarah Chen', referringNPI: '1234567890', referringPractice: 'Riverside Family Medicine', referringPhone: '(951) 555-0100', referringFax: '(951) 555-0101', specialistName: 'Dr. James Morrison', specialistSpecialty: 'Cardiology', specialistPractice: 'Riverside Cardiology Associates', specialistPhone: '(951) 555-0200', specialistFax: '(951) 555-0201', specialistAddress: '456 Heart Center Drive, Suite 300, Riverside, CA 92502', referralReason: 'Evaluation of coronary artery disease and heart failure management', primaryDiagnosis: 'I25.10 Atherosclerotic heart disease of native coronary artery without angina pectoris', secondaryDiagnoses: ['I50.32 Chronic diastolic heart failure'], clinicalSummary: '62-year-old male with CAD s/p stent 2019, HFpEF, T2DM, HTN, CKD 3a. Recently with mild SOB and weight gain. Needs cardiology evaluation for optimization of GDMT and assessment for additional intervention.', urgency: 'urgent', authorizationRequired: false, referralLetter: 'Dear Dr. Morrison, I am referring Mr. Robert Williams...', aiGeneratedLetter: false, attachedRecords: ['Recent CMP', 'BNP result', 'Medication list'], status: 'completed', sentDate: '2024-11-20', sentMethod: 'electronic', consultNoteReceived: true, consultNoteDate: '2024-12-05', consultNoteSummary: 'Cardiology recommends optimization of GDMT, continue current regimen, repeat echocardiogram in 6 months.', notes: '' });

  // Education materials
  eduStore.addMaterial({ title: 'Managing Type 2 Diabetes', condition: 'Type 2 Diabetes', readingLevel: '6th grade', language: 'English', content: 'What is Type 2 Diabetes? Your body has trouble using sugar for energy...', fullHandoutText: 'MANAGING TYPE 2 DIABETES\n\nWhat is it?\nType 2 diabetes means your body has trouble using sugar for energy...\n\nWhy it matters?\nHigh blood sugar can damage your heart, kidneys, eyes, and nerves...\n\nWhat you can do?\n1. Take your medications as prescribed\n2. Check your blood sugar as directed\n3. Eat healthy foods in the right amounts\n4. Exercise regularly\n\nWhen to call your doctor?\n- Blood sugar over 300 mg/dL\n- Feeling very thirsty and urinating often\n- Blurry vision\n\nWhen to go to the ER?\n- Trouble breathing\n- Severe stomach pain\n- Confusion' });

  console.log('Seed data loaded successfully');
}
