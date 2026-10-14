import { DpaRegion } from 'src/engine/core-modules/dpa/enums/dpa-region.enum';
import { type DpaRegionConfig } from 'src/engine/core-modules/dpa/types/dpa.type';

export const DEFAULT_DPA_REGION: DpaRegion = DpaRegion.EU;

const DPA_COMMON_VALUES = {
  PROCESSOR_ENTITY: 'TODO_LEGAL: Happy BPO (confirmar razón social)',
  PROCESSOR_LEGAL_FORM:
    'TODO_LEGAL: confirmar forma jurídica y jurisdicción (p. ej. S.A.S., Colombia)',
  // TODO_LEGAL: confirmar domicilio legal del responsable.
  PROCESSOR_ADDRESS: 'TODO_LEGAL: confirmar domicilio legal',
  GOVERNING_LAW: 'TODO_LEGAL: confirmar ley aplicable (p. ej. Colombia)',
  DPO_NAME_AND_CONTACT: 'TODO_LEGAL: confirmar responsable de privacidad y contacto',
  PRIVACY_CONTACT: 'TODO_LEGAL: confirmar email de privacidad',
};

export const DPA_REGION_CONFIGS: Record<DpaRegion, DpaRegionConfig> = {
  [DpaRegion.EU]: {
    region: DpaRegion.EU,
    sccSectionActive: true,
    values: {
      ...DPA_COMMON_VALUES,
      HOSTING_REGION: 'EU hosting location designated in the Agreement',
    },
  },
  [DpaRegion.US]: {
    region: DpaRegion.US,
    sccSectionActive: true,
    values: {
      ...DPA_COMMON_VALUES,
      HOSTING_REGION: 'US hosting location designated in the Agreement',
    },
  },
};

// TODO_LEGAL: reemplazar por el firmante real antes de cualquier firma.
export const HAPPY_PRESIGNED_SIGNATORY = {
  name: 'TODO_LEGAL: nombre del firmante',
  title: 'TODO_LEGAL: cargo del firmante',
};

export const getDpaRegionConfig = (region: DpaRegion): DpaRegionConfig =>
  DPA_REGION_CONFIGS[region] ?? DPA_REGION_CONFIGS[DEFAULT_DPA_REGION];
