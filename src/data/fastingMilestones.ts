export interface FastingMilestone {
  minHours: number;
  label: string;
  description: string;
}

export const FASTING_MILESTONES: FastingMilestone[] = [
  {
    minHours: 0,
    label: 'Vertering',
    description: 'Je lichaam verteert nog je laatste maaltijd en gebruikt die energie.',
  },
  {
    minHours: 4,
    label: 'Energie omschakelen',
    description:
      'Je lichaam schakelt geleidelijk over van directe vertering naar het aanspreken van opgeslagen glycogeen.',
  },
  {
    minHours: 12,
    label: 'Vetverbranding',
    description:
      'Glycogeenvoorraden raken op — je lichaam begint meer vet te verbranden voor energie.',
  },
  {
    minHours: 16,
    label: 'Lichte ketose',
    description:
      'Je lichaam kan in lichte ketose raken: de vetverbranding neemt verder toe.',
  },
  {
    minHours: 18,
    label: 'Hormonale ondersteuning',
    description:
      'De aanmaak van groeihormoon kan toenemen, wat spierbehoud tijdens het vasten kan ondersteunen.',
  },
  {
    minHours: 24,
    label: 'Celvernieuwing',
    description:
      'Autofagie kan op gang komen — een celvernieuwingsproces waarbij het lichaam beschadigde celonderdelen opruimt.',
  },
];

export function getFastingMilestone(hours: number): FastingMilestone {
  let current = FASTING_MILESTONES[0];
  for (const milestone of FASTING_MILESTONES) {
    if (hours >= milestone.minHours) {
      current = milestone;
    }
  }
  return current;
}
