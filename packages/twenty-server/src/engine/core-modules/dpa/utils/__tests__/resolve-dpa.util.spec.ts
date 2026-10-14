import {
  DEFAULT_DPA_REGION,
  DPA_REGION_CONFIGS,
} from 'src/engine/core-modules/dpa/config/dpa-region-config.constant';
import { DPA_TEMPLATE_VERSION } from 'src/engine/core-modules/dpa/constants/dpa-template-version.constant';
import subprocessorsData from 'src/engine/core-modules/dpa/constants/subprocessors.json';
import { DpaRegion } from 'src/engine/core-modules/dpa/enums/dpa-region.enum';
import { type SubprocessorList } from 'src/engine/core-modules/dpa/types/subprocessor.type';
import {
  findUnresolvedMergeFields,
  resolveDpa,
} from 'src/engine/core-modules/dpa/utils/resolve-dpa.util';

describe('resolveDpa', () => {
  it('defaults to EU hosting without changing the Processor entity or governing law', () => {
    const resolved = resolveDpa({
      region: DEFAULT_DPA_REGION,
      mode: 'preview',
    });

    expect(resolved.region).toBe('EU');
    expect(resolved.values.PROCESSOR_ENTITY).toContain('TODO_LEGAL');
    expect(resolved.values.PROCESSOR_LEGAL_FORM).toContain('TODO_LEGAL');
    expect(resolved.values.HOSTING_REGION).toContain('EU hosting location');
    expect(resolved.values.GOVERNING_LAW).toContain('TODO_LEGAL');
    expect(resolved.sccSectionActive).toBe(true);
    expect(resolved.templateVersion).toBe(DPA_TEMPLATE_VERSION);
  });

  it('resolves US hosting with the same Processor and EU Affiliate', () => {
    const resolved = resolveDpa({ region: DpaRegion.US, mode: 'preview' });

    expect(resolved.region).toBe('US');
    expect(resolved.values.PROCESSOR_ENTITY).toContain('TODO_LEGAL');
    expect(resolved.values.PROCESSOR_LEGAL_FORM).toContain('TODO_LEGAL');
    expect(resolved.values.HOSTING_REGION).toBe('US hosting location designated in the Agreement');
    expect(resolved.sccSectionActive).toBe(true);
  });

  it('keeps a single Happy processor with no EU affiliate independent of hosting region', () => {
    const eu = resolveDpa({ region: DpaRegion.EU, mode: 'preview' });
    const us = resolveDpa({ region: DpaRegion.US, mode: 'preview' });

    for (const resolved of [eu, us]) {
      expect(resolved.blocks[0].text).toContain('is the sole Processor');
      expect(resolved.blocks[0].text).toContain('no EU affiliate party');
      expect(resolved.blocks[0].text).not.toContain('EU Affiliate:');
    }
  });

  it('keeps the SCC/transfer sections (7.2–7.5) in the document for BOTH regions (document is not branched)', () => {
    const eu = resolveDpa({ region: DpaRegion.EU, mode: 'preview' });
    const us = resolveDpa({ region: DpaRegion.US, mode: 'preview' });

    const headings = (blocks: typeof eu.blocks) =>
      blocks.filter((block) => block.kind === 'heading').map((b) => b.text);

    for (const resolved of [eu, us]) {
      const text = resolved.blocks.map((b) => b.text).join('\n');

      expect(headings(resolved.blocks)).toContain(
        '7. International Data Transfers',
      );
      expect(text).toContain('7.2 European Data Transfers');
      expect(text).toContain('7.3 Transfers from Brazil');
      expect(text).toContain('7.4 Other Transfer Mechanisms');
      expect(text).toContain('7.5 Disclosure of SCCs');
    }
  });

  it('leaves no unresolved {{ }} merge fields for any region', () => {
    for (const region of Object.keys(DPA_REGION_CONFIGS) as DpaRegion[]) {
      const resolved = resolveDpa({ region, mode: 'signed' });

      expect(findUnresolvedMergeFields(resolved)).toEqual([]);
    }
  });

  it('only appends the execution / signature block in signed mode', () => {
    const preview = resolveDpa({ region: DpaRegion.EU, mode: 'preview' });
    const signed = resolveDpa({
      region: DpaRegion.EU,
      mode: 'signed',
      customerLegalEntityName: 'Acme GmbH',
      signatory: { name: 'Jane Doe', title: 'CEO' },
      executedAt: '2026-06-26T00:00:00.000Z',
    });

    expect(preview.blocks.some((b) => b.kind === 'signatureField')).toBe(false);

    const customerField = signed.blocks.find(
      (b) => b.kind === 'signatureField' && b.label === 'Customer (Controller)',
    );

    expect(customerField?.value).toContain('Acme GmbH');
    expect(customerField?.value).toContain('Jane Doe');
    expect(customerField?.value).toContain('CEO');
    expect(
      signed.blocks.some(
        (b) => b.kind === 'signatureField' && b.label === 'Execution Date',
      ),
    ).toBe(true);

    const processorField = signed.blocks.find(
      (b) =>
        b.kind === 'signatureField' &&
        b.label?.startsWith('Processor — '),
    );
    const euAffiliateField = signed.blocks.find(
      (b) =>
        b.kind === 'signatureField' &&
        (b.label ?? '').startsWith('EU Affiliate'),
    );

    expect(processorField?.value).toContain('Signed on behalf of');
    expect(processorField?.value).toContain('(pre-signed by Happy)');
    expect(euAffiliateField).toBeUndefined();
  });

  it('marks self-hosted deployments as not a valid agreement', () => {
    const cloud = resolveDpa({ region: DpaRegion.EU, mode: 'preview' });
    const selfHosted = resolveDpa({
      region: DpaRegion.EU,
      mode: 'preview',
      isSelfHosted: true,
    });

    expect(cloud.notice).toBeUndefined();
    expect(selfHosted.notice).toContain('NOT A VALID AGREEMENT');
  });

  it('records the template version so we can prove what was agreed', () => {
    const signed = resolveDpa({ region: DpaRegion.US, mode: 'signed' });

    const versionField = signed.blocks.find(
      (b) => b.kind === 'signatureField' && b.label === 'DPA template version',
    );

    expect(versionField?.value).toContain(DPA_TEMPLATE_VERSION);
  });

  const resolvedText = (region: DpaRegion, mode: 'preview' | 'signed') =>
    resolveDpa({
      region,
      mode,
      customerLegalEntityName: 'Acme GmbH',
      signatory: { name: 'Jane Doe', title: 'Head of Legal' },
      executedAt: '2026-06-27T00:00:00.000Z',
    })
      .blocks.map((b) => `${b.text}\n${b.label ?? ''}\n${b.value ?? ''}`)
      .join('\n');

  it('resolves clean, article-free hosting region values per region', () => {
    expect(
      resolveDpa({ region: DpaRegion.EU, mode: 'preview' }).values
        .HOSTING_REGION,
    ).toBe('EU hosting location designated in the Agreement');
    expect(
      resolveDpa({ region: DpaRegion.US, mode: 'preview' }).values
        .HOSTING_REGION,
    ).toBe('US hosting location designated in the Agreement');

    // Template phrasing "in the {{HOSTING_REGION}}" must not double the article.
    expect(resolvedText(DpaRegion.EU, 'signed')).toContain(
      'in the EU hosting location designated in the Agreement',
    );
    expect(resolvedText(DpaRegion.EU, 'signed')).not.toMatch(/\bthe the\b/);
  });

  it('has exactly one "7.1 Data Hosting and Localization:" heading', () => {
    const matches =
      resolvedText(DpaRegion.EU, 'signed').match(
        /7\.1 Data Hosting and Localization:/g,
      ) ?? [];

    expect(matches).toHaveLength(1);
  });

  it('leaks no internal drafting notes or placeholder tokens for either region', () => {
    for (const region of [DpaRegion.EU, DpaRegion.US]) {
      const text = resolvedText(region, 'signed');

      expect(text).not.toContain('(default:');
      expect(text).not.toContain('for US deployments');
      expect(text).not.toContain('LEGAL ENTITY');
      expect(text).not.toContain('SIGNATORY NAME');
    }
  });

  it('renders the TODO_LEGAL privacy contact provisionals', () => {
    const text = resolvedText(DpaRegion.EU, 'signed');

    expect(text).toContain('TODO_LEGAL');
  });

  it('states the §7.1 hosting location per region without contradicting the deployment', () => {
    const eu = resolvedText(DpaRegion.EU, 'signed');
    const us = resolvedText(DpaRegion.US, 'signed');

    for (const text of [eu, us]) {
      expect(text).not.toContain(
        'primarily stored in data centers located in the European Union',
      );
    }

    expect(eu).toContain(
      'hosted in data centers in the EU hosting location designated in the Agreement',
    );
    expect(us).toContain(
      'hosted in data centers in the US hosting location designated in the Agreement',
    );

    expect(us).not.toContain('EU hosting location');
  });

  it('identifies the Happy processor and data importer with no EU Affiliate in Annex A', () => {
    for (const region of [DpaRegion.EU, DpaRegion.US]) {
      const text = resolvedText(region, 'signed');

      expect(text).toContain('Data Importer (Processor): TODO_LEGAL');
      expect(text).not.toContain('EU Affiliate:');
    }
  });

  it('includes a government / law enforcement request clause for both regions', () => {
    for (const region of [DpaRegion.EU, DpaRegion.US]) {
      const text = resolvedText(region, 'signed');

      expect(text).toContain('Government and Law Enforcement Requests');
      expect(text).toContain('will not voluntarily disclose');
      expect(text).toContain('back doors');
    }
  });

  it('states no SOC 2 certification and does not claim ISO 27001', () => {
    const text = resolvedText(DpaRegion.EU, 'signed');

    expect(text).toContain('does not currently maintain a SOC 2');
    expect(text).not.toContain('ISO 27001');
  });

  it('renders Annex C with one entry per synced sub-processor and ties it to §6.1', () => {
    const text = resolvedText(DpaRegion.EU, 'signed');
    const { subprocessors } = subprocessorsData as SubprocessorList;

    expect(text).toContain('ANNEX C – List of Sub-Processors');
    expect(text).toContain('set out in Annex C');

    // Derived from synced data because the trust-center sync overwrites vendor locations.
    for (const subprocessor of subprocessors) {
      const vendorSuffix = subprocessor.vendorUrl
        ? ` (${subprocessor.vendorUrl})`
        : '';

      expect(text).toContain(
        `${subprocessor.name}${vendorSuffix} — Processing location(s):`,
      );
    }
  });

  it('expands the sub-processor sentinel into exactly the synced entries', () => {
    const resolved = resolveDpa({ region: DpaRegion.EU, mode: 'preview' });

    expect(
      resolved.blocks.some((b) => b.kind === 'paragraph' && b.text === ''),
    ).toBe(false);

    const entries = resolved.blocks.filter(
      (b) =>
        b.kind === 'paragraph' && / — Processing location\(s\): /.test(b.text),
    );
    const expectedCount = (subprocessorsData as SubprocessorList).subprocessors
      .length;

    expect(entries).toHaveLength(expectedCount);
  });

  it('never shows the self-hosted banner on an executed (signed) document', () => {
    expect(
      resolveDpa({ region: DpaRegion.EU, mode: 'preview', isSelfHosted: true })
        .notice,
    ).toContain('NOT A VALID AGREEMENT');
    expect(
      resolveDpa({
        region: DpaRegion.EU,
        mode: 'signed',
        customerLegalEntityName: 'Acme GmbH',
        signatory: { name: 'Jane Doe', title: 'Head of Legal' },
        executedAt: '2026-06-27T00:00:00.000Z',
        isSelfHosted: true,
      }).notice,
    ).toBeUndefined();
    expect(
      resolveDpa({ region: DpaRegion.EU, mode: 'preview', isSelfHosted: false })
        .notice,
    ).toBeUndefined();
  });
});
