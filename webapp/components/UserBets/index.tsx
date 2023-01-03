import { useStyles } from './styles';
import { useEffect, useState } from 'react';
import { IconFilePlus, IconChevronDown } from '@tabler/icons';
import { Select, Button, Group } from '@mantine/core';
import detectEthereumProvider from '@metamask/detect-provider';
import blockchainnet from '../../blockchainnet.json';
import contracts from '../../contracts.json';
import { AbiItem } from 'web3-utils'
import Web3 from 'web3';
import Link from 'next/link';
import DisplayBet from '../DisplayBet';
import DisplayBetMarket from '../DisplayBetMarket';
import DisplaySecretBet from '../DisplaySecretBet';

interface UserBetsProps {
  isConnected: boolean,
  user: string,
}

export default function UserBets({ isConnected, user }: UserBetsProps) {
  const { classes, cx } = useStyles();

  const [betType, setBetType] = useState<string | null>('all');
  const [betStatus, setBetStatus] = useState<string | null>('all');
  const [userBets, setUserBets] = useState<any>();
  const [userBetMarkets, setUserBetMarkets] = useState<any>();
  const [userSecretBets, setUserSecretBets] = useState<any>();

  const Testnet = blockchainnet.Testnet;
  const TestnetRpc = blockchainnet.TestnetRpc;

  const web3 = new Web3((Web3 as any).currentProvider || new Web3.providers.HttpProvider(TestnetRpc));
  const BetNumber = new web3.eth.Contract(contracts.BetNumber.abi as unknown as AbiItem, contracts.BetNumber.address);
  const BetMarket = new web3.eth.Contract(contracts.BetMarket.abi as unknown as AbiItem, contracts.BetMarket.address);
  const BetNumberSecretAnswer = new web3.eth.Contract(contracts.BetNumberSecretAnswer.abi as unknown as AbiItem, contracts.BetNumberSecretAnswer.address);

  const getUserBets = async () => {
    const provider = (await detectEthereumProvider()) as any;

    if (provider) {
      setUserBets(await BetNumber.methods.getUserBetsNormal(provider.selectedAddress).call());
    } else {
      console.log("Please install MetaMask!");
    }
  }

  const getUserBetMarkets = async () => {
    const provider = (await detectEthereumProvider()) as any;

    if (provider) {
      setUserBetMarkets(await BetMarket.methods.getUserBets(provider.selectedAddress).call());
    } else {
      console.log("Please install MetaMask!");
    }
  }

  const getUserBetSecretBets = async () => {
    const provider = (await detectEthereumProvider()) as any;

    if (provider) {
      setUserSecretBets(await BetNumberSecretAnswer.methods.getUserSecretBets(provider.selectedAddress).call());
    } else {
      console.log("Please install MetaMask!");
    }
  }

  useEffect(() => {
    if (isConnected === true) {
      getUserBets();
      getUserBetMarkets();
      getUserBetSecretBets();
    }
  }, [isConnected]);

  return (
    <div className={classes.wrapper}>
      <div className={classes.horizontalContainer}>
        <Group spacing="xs">
          <Select
            value={betType}
            onChange={setBetType}
            sx={{ maxWidth: '132.84px' }}
            rightSection={<IconChevronDown size={14} />}
            rightSectionWidth={28}
            styles={{ rightSection: { pointerEvents: 'none' } }}
            data={[
              { value: 'all', label: 'All types' },
              { value: 'market', label: 'Bet Market' },
              { value: 'number', label: 'Bet Number' },
              { value: 'secret', label: 'Bet Secret' },
            ]}
          />

          <Select
            value={betStatus}
            onChange={setBetStatus}
            sx={{ maxWidth: '132.84px' }}
            rightSection={<IconChevronDown size={14} />}
            rightSectionWidth={28}
            styles={{ rightSection: { pointerEvents: 'none' } }}
            data={[
              { value: 'all', label: 'All statuses' },
              { value: 'active', label: 'Active Bets' },
              { value: 'unrevealed', label: 'Pending Bets' },
              { value: 'finished', label: 'Finished Bets' },
            ]}
          />
        </Group>

        <Link href="/newbet" passHref>
          <Button
            component='a'
            leftIcon={<IconFilePlus size={20} stroke={1.5} />}
          >
            Create bet
          </Button>
        </Link>
      </div>

      {
        (userBetMarkets !== undefined && betType !== 'number' && betType !== 'secret') && userBetMarkets.slice(0).reverse().map((bet: any) => (
          <div key={bet.id}>
            {
              (betStatus == 'all') &&
              <DisplayBetMarket
                user={user}
                {...bet}
              />
            }
            {
              (betStatus == 'active' && bet.status == 0 && Date.now() < bet.bettingDeadline * 1000) &&
              <DisplayBetMarket
                user={user}
                {...bet}
              />
            }
            {
              (betStatus == 'unrevealed' && bet.status == 0 && Date.now() > bet.bettingDeadline * 1000) &&
              <DisplayBetMarket
                user={user}
                {...bet}
              />
            }
            {
              (betStatus == 'finished' && bet.status == 1) &&
              <DisplayBetMarket
                user={user}
                {...bet}
              />
            }
          </div>
        ))
      }
      {
        (userBets !== undefined && betType !== 'market' && betType !== 'secret') && userBets.slice(0).reverse().map((bet: any) => (
          <div key={bet.id}>
            {
              (betStatus == 'all') &&
              <DisplayBet
                user={user}
                {...bet}
              />
            }
            {
              (betStatus == 'active' && bet.status == 1 && Date.now() < bet.bettingDeadline * 1000) &&
              <DisplayBet
                user={user}
                {...bet}
              />
            }
            {
              (betStatus == 'unrevealed' && bet.status == 1 && Date.now() > bet.bettingDeadline * 1000) &&
              <DisplayBet
                user={user}
                {...bet}
              />
            }
            {
              (betStatus == 'finished' && bet.status == 4) &&
              <DisplayBet
                user={user}
                {...bet}
              />
            }
          </div>
        ))
      }
      {
        (userSecretBets !== undefined && betType !== 'market' && betType !== 'number') && userSecretBets.slice(0).reverse().map((bet: any) => (
          <div key={bet.id}>
            {
              (betStatus == 'all') &&
              <DisplaySecretBet
                user={user}
                {...bet}
              />
            }
            {
              (betStatus == 'active' && bet.status == 1 && Date.now() < bet.bettingDeadline * 1000) &&
              <DisplaySecretBet
                user={user}
                {...bet}
              />
            }
            {
              (betStatus == 'unrevealed' && bet.status == 1 && Date.now() > bet.bettingDeadline * 1000) &&
              <DisplaySecretBet
                user={user}
                {...bet}
              />
            }
            {
              (betStatus == 'finished' && bet.status == 4) &&
              <DisplaySecretBet
                user={user}
                {...bet}
              />
            }
          </div>
        ))
      }
    </div >
  )
}
