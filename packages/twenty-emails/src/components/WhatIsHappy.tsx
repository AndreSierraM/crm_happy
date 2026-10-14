import { type I18n } from '@lingui/core';
import { MainText } from 'src/components/MainText';
import { SubTitle } from 'src/components/SubTitle';

type WhatIsHappyProps = {
  i18n: I18n;
};

export const WhatIsHappy = ({ i18n }: WhatIsHappyProps) => {
  return (
    <>
      <SubTitle value={i18n._('¿Qué es Happy CRM?')} />
      <MainText>
        {i18n._(
          'Es el CRM de Happy BPO para gestionar clientes, ventas y relaciones desde un solo lugar.',
        )}
      </MainText>
    </>
  );
};
