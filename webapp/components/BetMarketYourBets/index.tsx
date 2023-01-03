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

interface BetMarketYourBetsProps {
  isConnected: boolean,
  user: string,
  betStatus: string | null,
}

export default function BetMarketYourBets({ isConnected, user, betStatus }: BetMarketYourBetsProps) {
  const { classes, cx } = useStyles();

  const [userBetMarkets, setUserBetMarkets] = useState<any>();

  const Testnet = blockchainnet.Testnet;
  const TestnetRpc = blockchainnet.TestnetRpc;

  const web3 = new Web3((Web3 as any).currentProvider || new Web3.providers.HttpProvider(TestnetRpc));
  const BetMarket = new web3.eth.Contract(contracts.BetMarket.abi as unknown as AbiItem, contracts.BetMarket.address);

  const getUserBetMarkets = async () => {
    const provider = (await detectEthereumProvider()) as any;

    if (provider) {
      setUserBetMarkets(await BetMarket.methods.getBetsParticipated(provider.selectedAddress).call());
    } else {
      console.log("Please install MetaMask!");
    }
  }

  useEffect(() => {
    if (isConnected === true) {
      getUserBetMarkets();
    }
  }, [isConnected]);

  return (
    <>
      {
        (userBetMarkets !== undefined) && userBetMarkets.slice(0).reverse().map((bet: any) => (
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
    </>
  )
}
