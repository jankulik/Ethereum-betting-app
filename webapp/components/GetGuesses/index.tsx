import { useStyles } from './styles';
import { useState, useEffect } from 'react';
import { Text, RingProgress, Center } from '@mantine/core';
import detectEthereumProvider from '@metamask/detect-provider';
import blockchainnet from '../../blockchainnet.json';
import contracts from '../../contracts.json';
import { AbiItem } from 'web3-utils'
import Web3 from 'web3';
import TableSortGuesses from '../TableSortGuesses';

interface GetGuessesProps {
  betId: string,
  totalBets: string,
  secretBet: boolean,
  user: string,
}

export default function GetGuesses({ betId, totalBets, secretBet, user }: GetGuessesProps) {
  const { classes, cx } = useStyles();

  const [guesses, setGuesses] = useState<Array<Array<string>>>();
  const [options, setOptions] = useState<Array<Array<string>>>();

  const Testnet = blockchainnet.Testnet;
  const TestnetRpc = blockchainnet.TestnetRpc;

  const ascii85 = require('ascii85');
  const web3 = new Web3((Web3 as any).currentProvider || new Web3.providers.HttpProvider(TestnetRpc));
  const BetNumber = new web3.eth.Contract(contracts.BetNumber.abi as unknown as AbiItem, contracts.BetNumber.address);
  const BetNumberSecretAnswer = new web3.eth.Contract(contracts.BetNumberSecretAnswer.abi as unknown as AbiItem, contracts.BetNumberSecretAnswer.address);

  const colors = ["#e60049", "#0bb4ff", "#50e991", "#e6d800", "#9b19f5", "#ffa300", "#dc0ab4", "#b3d4ff", "#00bfa0"];

  const getRandomColor = () => {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    console.log(color);
    return color.toString();
  }

  const getGuesses = async () => {
    const provider = (await detectEthereumProvider()) as any;

    if (provider) {
      if (!secretBet){
        setGuesses(await BetNumber.methods.getGuesses(betId).call());
      } else {
        setGuesses(await BetNumberSecretAnswer.methods.getGuesses(betId).call());
      }
      
    } else {
      console.log("Please install MetaMask!");
    }
  }

  const getOptions = async () => {
    const provider = (await detectEthereumProvider()) as any;

    if (provider) {
      if (!secretBet){
        setOptions(await BetNumber.methods.getOptions(betId).call());
      } else {
        setOptions(await BetNumberSecretAnswer.methods.getOptions(betId).call());
      }
    } else {
      console.log("Please install MetaMask!");
    }
  }

  useEffect(() => {
    getGuesses();
  }, []);

  useEffect(() => {
    getOptions();
  }, []);

  const renderGuesses = () => {
    if (totalBets === '0') {
      return (
        <>
          <Center>
            <Text>
              There are no guesses yet
            </Text>
          </Center>
        </>
      )
    } else {
      const totalBetsInt = parseInt(totalBets);

      var circleSections = [];
      if (options !== undefined && !secretBet) {
        for (let i = 0; i < options?.length; i++) {
          const value = Math.round(parseInt(options[i][1]) / totalBetsInt * 100);

          if (Number.isInteger(value)) {
            if (i < colors.length)
              circleSections.push({ value: value, color: colors[i], tooltip: options[i][0] });
            else
              circleSections.push({ value: value, color: getRandomColor(), tooltip: options[i][0] });
          }
        }
      }

      var tableElements = [];
      if (guesses !== undefined) {
        for (let i = 0; i < guesses?.length; i++) {
          if (!secretBet){
            if (totalBetsInt < 10 ** 13) {
              tableElements.push({ fullBettor: guesses[i][1], bettor: guesses[i][1].substring(0, 5) + '...' + guesses[i][1].substring(38, 42), amount: guesses[i][2] + ' Wei', guess: guesses[i][4] });
            } else {
              tableElements.push({ fullBettor: guesses[i][1], bettor: guesses[i][1].substring(0, 5) + '...' + guesses[i][1].substring(38, 42), amount: `${Math.round(parseInt(guesses[i][2]) / 10 ** 18 * 100000) / 100000} ETH`, guess: guesses[i][4] });
            }
          } else {
            if (totalBetsInt < 10 ** 13) {
              if (guesses[i][3]) {
                tableElements.push({ fullBettor: guesses[i][1], bettor: guesses[i][1].substring(0, 5) + '...' + guesses[i][1].substring(38, 42), amount: guesses[i][2] + ' Wei', guess: guesses[i][4] });
              } else {
                tableElements.push({ fullBettor: guesses[i][1], bettor: guesses[i][1].substring(0, 5) + '...' + guesses[i][1].substring(38, 42), amount: guesses[i][2] + ' Wei', guess: 'Encrypted' });
              }
            } else {
              if (guesses[i][3]) {
                tableElements.push({ fullBettor: guesses[i][1], bettor: guesses[i][1].substring(0, 5) + '...' + guesses[i][1].substring(38, 42), amount: `${Math.round(parseInt(guesses[i][2]) / 10 ** 18 * 100000) / 100000} ETH`, guess: guesses[i][4] });
              } else {
                tableElements.push({ fullBettor: guesses[i][1], bettor: guesses[i][1].substring(0, 5) + '...' + guesses[i][1].substring(38, 42), amount: `${Math.round(parseInt(guesses[i][2]) / 10 ** 18 * 100000) / 100000} ETH`, guess: 'Encrypted' });
              }
            }
          }
        }
      }

      if (!secretBet) {
        return (
          <>
            <RingProgress
              size={170}
              thickness={16}
              label={
                <Text size="xs" align="center" px="xs" sx={{ pointerEvents: 'none' }}>
                  Distribution of guesses
                </Text>
              }
              sections={circleSections}
            />
  
            {tableElements.length !== 0 &&
              <TableSortGuesses data={tableElements} />
            }
          </>
        )
      } else {
        return (
          <>  
            <br/>
            {tableElements.length !== 0 &&
              <TableSortGuesses data={tableElements} />
            }
          </>
        )
      }
      
    }
  }

  return (
    <>
      {renderGuesses()}
    </>
  )
}