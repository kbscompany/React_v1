// Pixel to centimeter conversion utility for cheque positioning
// Based on A4 dimensions: 595px width → 21cm, 842px height → 29.7cm
export const PX_TO_CM = 0.026458;

export const pxToCm = (px: number): number => {
  return +(px * PX_TO_CM).toFixed(2);
};

export const cmToPx = (cm: number): number => {
  return +(cm / PX_TO_CM).toFixed(0);
}; 