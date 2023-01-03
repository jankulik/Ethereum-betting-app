import { NumberInput } from '@mantine/core';
import { useStyles } from './styles';
import { IconCurrencyDollar } from '@tabler/icons';
import { useState, useEffect } from 'react';
import { Select } from '@mantine/core';

interface AmountInputProps {
  betValueError: string,
  label: string,
  handleNewBetValue(newBetValue: number | undefined): any,
}

export default function AmountInput({ betValueError, label, handleNewBetValue }: AmountInputProps) {
  const { classes, cx } = useStyles();

  const [betValue, setBetValue] = useState<number>();
  const [betValueWei, setBetValueWei] = useState<number>();
  const [currency, setCurrecy] = useState<string | null>('wei');

  useEffect(() => {
    handleNewBetValue(betValueWei);
  }, [betValueWei]);

  return (
    <div className={classes.horizontalContainer}>
      <NumberInput
        value={betValue}
        onChange={(value) => {
          setBetValue(value);
          if (value !== undefined) {
            switch (currency) {
              case 'wei':
                setBetValueWei(value);
                break;
              case 'gwei':
                setBetValueWei(value * 10 ** 9);
                break;
              case 'finney':
                setBetValueWei(value * 10 ** 15);
                break;
              case 'ether':
                setBetValueWei(value * 10 ** 18);
                break;
            }
          }
        }}
        placeholder="Pick a number"
        label={label}
        icon={<IconCurrencyDollar size={16} />}
        min={0}
        parser={(value) => value?.replace(/\$\s?|(,*)/g, '')}
        formatter={(value) => {
          if (value !== undefined)
            return (!Number.isNaN(parseFloat(value)) ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '');
          else
            return ('');
        }}
        error={betValueError ? betValueError : false}
        styles={() => ({
          root: {
            width: 'calc(100% - 100px)',
          },
        })}
      />

      <Select
        label="Currency"
        value={currency}
        onChange={(value) => {
          setCurrecy(value);
          if (betValue !== undefined) {
            switch (value) {
              case 'wei':
                setBetValueWei(betValue);
                break;
              case 'gwei':
                setBetValueWei(betValue * 10 ** 9);
                break;
              case 'finney':
                setBetValueWei(betValue * 10 ** 15);
                break;
              case 'ether':
                setBetValueWei(betValue * 10 ** 18);
                break;
            }
          }
        }}
        data={[
          { value: 'wei', label: 'Wei' },
          { value: 'gwei', label: 'Gwei' },
          { value: 'finney', label: 'Finney' },
          { value: 'ether', label: 'ETH' },
        ]}
        styles={() => ({
          root: {
            marginTop: `${betValueError ? '-20px' : '0px'}`,
            width: '90px',
          },
        })}
      />
    </div>
  )
}