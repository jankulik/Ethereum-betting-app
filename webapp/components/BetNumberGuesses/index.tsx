import { useStyles } from './styles';
import { useEffect, useState } from 'react';
import { IconFilePlus, IconChevronDown } from '@tabler/icons';
import { Select, Button, Group } from '@mantine/core';
import detectEthereumProvider from '@metamask/detect-provider';
import blockchainnet from '../../blockchainnet.json';
import contracts from '../../contracts.json';
import { AbiItem } from 'web3-utils'
import Web3 from 'web3';
import DisplayUserGuess from '../DisplayUserGuess';

interface BetNumberGuessesProps {
  isConnected: boolean,
  user: string,
}

interface UserGuess {
  guessId: number,
  betId: string,
}

export default function BetNumberGuesses({ isConnected, user }: BetNumberGuessesProps) {
  const { classes, cx } = useStyles();
  const [userGuesses, setUserGuesses] = useState<Array<Array<UserGuess>>>();
  const [userSecretGuesses, setUserSecretGuesses] = useState<Array<Array<UserGuess>>>();

  const Testnet = blockchainnet.Testnet;
  const TestnetRpc = blockchainnet.TestnetRpc;

  const web3 = new Web3((Web3 as any).currentProvider || new Web3.providers.HttpProvider(TestnetRpc));
  const BetNumber = new web3.eth.Contract(contracts.BetNumber.abi as unknown as AbiItem, contracts.BetNumber.address);
  const BetNumberSecretAnswer = new web3.eth.Contract(contracts.BetNumberSecretAnswer.abi as unknown as AbiItem, contracts.BetNumberSecretAnswer.address);

  const getUserGuesses = async () => {
    const provider = (await detectEthereumProvider()) as any;

    if (provider) {
      setUserGuesses(await BetNumber.methods.getUserGuesses(provider.selectedAddress).call());
    } else {
      console.log("Please install MetaMask!");
    }
  }

  const getUserSecretGuesses = async () => {
    const provider = (await detectEthereumProvider()) as any;

    if (provider) {
      setUserSecretGuesses(await BetNumberSecretAnswer.methods.getUserGuesses(provider.selectedAddress).call());
    } else {
      console.log("Please install MetaMask!");
    }
  }

  useEffect(() => {
    if (isConnected === true) {
      getUserGuesses();
      getUserSecretGuesses();
    }
  }, [isConnected]);

  return (
    <>
      {
        (userSecretGuesses !== undefined) && userSecretGuesses.slice(0).reverse().map((guess: any) => (
          <div key={guess.id}>
            {
              <DisplayUserGuess
                isConnected={isConnected}
                betNumber={BetNumber}
                betNumberSecretAnswer={BetNumberSecretAnswer}
                secretBet={true}
                user={user}
                {...guess}
              />
            }
          </div>
        ))
      }
      {
        (userGuesses !== undefined) && userGuesses.slice(0).reverse().map((guess: any) => (
          <div key={guess.id}>
            {
              <DisplayUserGuess
                isConnected={isConnected}
                betNumber={BetNumber}
                betNumberSecretAnswer={BetNumberSecretAnswer}
                secretBet={false}
                user={user}
                {...guess}
              />
            }
          </div>
        ))
      }
    </>
  )
}
