export const MEASUREMENT_TEMPLATES = {
  mens_shirt: {
    label: "Men's Shirt",
    fields: [
      { name: 'chest', label: 'Chest', helpText: 'Measure around the fullest part', unit: 'cm' },
      { name: 'waist', label: 'Waist', helpText: 'Measure around natural waistline', unit: 'cm' },
      { name: 'shoulder', label: 'Shoulder Width', helpText: 'From shoulder point to shoulder point', unit: 'cm' },
      { name: 'sleeveLength', label: 'Sleeve Length', helpText: 'From shoulder to wrist', unit: 'cm' },
      { name: 'shirtLength', label: 'Shirt Length', helpText: 'From neck to bottom hem', unit: 'cm' },
      { name: 'neck', label: 'Neck', helpText: 'Around the base of neck', unit: 'cm' },
      { name: 'armhole', label: 'Armhole', helpText: 'Around armpit area', unit: 'cm' },
    ],
  },
  mens_pants: {
    label: "Men's Pants",
    fields: [
      { name: 'waist', label: 'Waist', helpText: 'Around natural waistline', unit: 'cm' },
      { name: 'hips', label: 'Hips', helpText: 'Around fullest part of hips', unit: 'cm' },
      { name: 'inseam', label: 'Inseam', helpText: 'From crotch to ankle', unit: 'cm' },
      { name: 'outseam', label: 'Outseam', helpText: 'From waist to ankle', unit: 'cm' },
      { name: 'thigh', label: 'Thigh', helpText: 'Around fullest part of thigh', unit: 'cm' },
      { name: 'knee', label: 'Knee', helpText: 'Around knee', unit: 'cm' },
      { name: 'ankle', label: 'Ankle', helpText: 'Around ankle', unit: 'cm' },
    ],
  },
  mens_kurta: {
    label: "Men's Kurta",
    fields: [
      { name: 'chest', label: 'Chest', unit: 'cm' },
      { name: 'waist', label: 'Waist', unit: 'cm' },
      { name: 'shoulder', label: 'Shoulder Width', unit: 'cm' },
      { name: 'sleeveLength', label: 'Sleeve Length', unit: 'cm' },
      { name: 'kurtaLength', label: 'Kurta Length', unit: 'cm' },
      { name: 'neck', label: 'Neck', unit: 'cm' },
    ],
  },
  womens_blouse: {
    label: "Women's Blouse",
    fields: [
      { name: 'bust', label: 'Bust', helpText: 'Around fullest part', unit: 'cm' },
      { name: 'waist', label: 'Waist', unit: 'cm' },
      { name: 'shoulder', label: 'Shoulder Width', unit: 'cm' },
      { name: 'sleeveLength', label: 'Sleeve Length', unit: 'cm' },
      { name: 'blouseLength', label: 'Blouse Length', unit: 'cm' },
      { name: 'armhole', label: 'Armhole', unit: 'cm' },
      { name: 'neck', label: 'Neck', unit: 'cm' },
    ],
  },
  womens_kurti: {
    label: "Women's Kurti",
    fields: [
      { name: 'bust', label: 'Bust', unit: 'cm' },
      { name: 'waist', label: 'Waist', unit: 'cm' },
      { name: 'hips', label: 'Hips', unit: 'cm' },
      { name: 'shoulder', label: 'Shoulder Width', unit: 'cm' },
      { name: 'sleeveLength', label: 'Sleeve Length', unit: 'cm' },
      { name: 'kurtiLength', label: 'Kurti Length', unit: 'cm' },
    ],
  },
  womens_saree_blouse: {
    label: "Women's Saree Blouse",
    fields: [
      { name: 'bust', label: 'Bust', unit: 'cm' },
      { name: 'underbust', label: 'Under Bust', unit: 'cm' },
      { name: 'waist', label: 'Waist', unit: 'cm' },
      { name: 'shoulder', label: 'Shoulder Width', unit: 'cm' },
      { name: 'sleeveLength', label: 'Sleeve Length', unit: 'cm' },
      { name: 'blouseLength', label: 'Blouse Length', unit: 'cm' },
      { name: 'armhole', label: 'Armhole', unit: 'cm' },
      { name: 'neckDepth', label: 'Neck Depth', unit: 'cm' },
    ],
  },
};

export const TEMPLATE_OPTIONS = Object.entries(MEASUREMENT_TEMPLATES).map(([value, config]) => ({
  value,
  label: config.label,
}));
