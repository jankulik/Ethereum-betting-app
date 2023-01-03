import Head from 'next/head';
import Shell from '../components/Shell';
import { useState } from 'react';
import { useStyles } from '../styles/NewBet.styles';
import { Select } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons';
import CreateBet from '../components/CreateBet';
import CreateBetMarket from '../components/CreateBetMarket';

export default function NewBet() {
  const { classes, cx } = useStyles();

  const [betSelection, setBetSelection] = useState<string | null>('market');

  const [isConnected, setIsConnected] = useState(false);
  const [accounts, setAccounts] = useState(Array<string>);
  const [connectedBalance, setConnectedBalance] = useState('0');

  const handleNewAccounts = (newAccounts: Array<string>) => setAccounts(newAccounts);
  const handleNewConnectedBalance = (newConnectedBalance: string) => setConnectedBalance(newConnectedBalance);
  const handleNewIsConnected = (newIsConneted: boolean) => setIsConnected(newIsConneted);

  return (
    <>
      <Head>
        <title>Betting dApp</title>
      </Head>

      <Shell
        isConnected={isConnected}
        accounts={accounts}
        connectedBalance={connectedBalance}
        handleNewAccounts={handleNewAccounts}
        handleNewConnectedBalance={handleNewConnectedBalance}
        handleNewIsConnected={handleNewIsConnected}
      >
        <div className={classes.wrapper}>
          <div className={classes.horizontalContainer}>
            <Select
              placeholder="Pick one"
              value={betSelection}
              onChange={setBetSelection}
              sx={{ maxWidth: '132.84px' }}
              rightSection={<IconChevronDown size={14} />}
              rightSectionWidth={29}
              styles={{ rightSection: { pointerEvents: 'none' } }}
              data={[
                { value: 'market', label: 'Bet Market' },
                { value: 'number', label: 'Bet Number' },
              ]}
            />
          </div>

          {betSelection === 'market' && <CreateBetMarket isConnected={isConnected} />}
          {betSelection === 'number' && <CreateBet isConnected={isConnected} />}
        </div>
      </Shell>
    </>
  )
}
