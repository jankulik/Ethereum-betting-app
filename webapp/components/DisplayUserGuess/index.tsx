import { useStyles } from './styles';
import { useState, useEffect } from 'react';
import Card from '../Card';
import detectEthereumProvider from '@metamask/detect-provider';
import Bet from '../Bet';
import { CopyButton, Tooltip, ActionIcon, Button, Text, Collapse, Group, Modal, SimpleGrid } from '@mantine/core';
import { IconCheck, IconX, IconCopy, IconChevronRight, IconFilePlus } from '@tabler/icons';
import blockchainnet from '../../blockchainnet.json';
import contracts from '../../contracts.json';
import { AbiItem } from 'web3-utils'
import Web3 from 'web3';
import { showNotification } from '@mantine/notifications';
import NameValue from '../NameValue'

interface DisplayGuessProps {
  guessId: number,
  betId: string,
  isConnected: boolean,  
  secretBet: boolean,
  betNumber: any,//should be contract
  betNumberSecretAnswer: any,
  user: string
}


interface Guess{
  betId: string,
  id: number,
  bettor: string,
  amount: number,
  evaluated: boolean,
  guess: number,
  nonce: number
}

function convertToGuess(obj: any): Guess{
  return {
    betId: obj.betId,
    id: parseInt(obj.id),
    bettor: obj.bettor,
    amount: parseInt(obj.amount),
    evaluated: obj.evaluated,
    guess: parseInt(obj.guess),
    nonce: parseInt(obj.nonce)
  }
}

enum Status {
  Active= "Active",
  Finished="Finished",
  Unrevealed="Answer Rnrevealed",
  Revealed="Answer Revealed"
}

let ID_TO_STATUS_MAP = new Map<number,Status>([
  [1, Status.Active],
  [2, Status.Unrevealed],
  [3, Status.Revealed],
  [4, Status.Finished] ]);

interface Bet{
  id: string,
  name: string,
  owner: string,
  bettingDeadline: Date,
  answerRevealDeadline: Date,
  prizeClaimDeadline: Date,
  status: Status
}

function convertToBet(obj: any): Bet{
  return {
    id: obj.id,
    name: obj.name,
    owner: obj.owner,
    bettingDeadline: new Date(parseInt(obj.bettingDeadline)*1000),
    answerRevealDeadline: new Date(parseInt(obj.answerRevealDeadline)*1000),
    prizeClaimDeadline: new Date(parseInt(obj.prizeClaimDeadline)*1000),
    status: ID_TO_STATUS_MAP.get(parseInt(obj.status))!
  }
}

function renderDate(date:Date){
  return `${date.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })} ${date.toLocaleTimeString()}`
}


export default function DisplayUserGuess({
  guessId,
  betId,
  isConnected,
  secretBet,
  betNumberSecretAnswer,
  betNumber,
  user
}: DisplayGuessProps) {
  const { classes, cx, theme } = useStyles();

  const [guess, setGuess] = useState<Guess|undefined>(undefined);
  const [bet, setBet] = useState<Bet|undefined>();
  const [encryptedData, setEncryptedData] = useState<any>();
  const TestnetRpc = blockchainnet.TestnetRpc;

  const web3 = new Web3((Web3 as any).currentProvider || new Web3.providers.HttpProvider(TestnetRpc));
  const BetNumber = new web3.eth.Contract(contracts.BetNumber.abi as unknown as AbiItem, contracts.BetNumber.address);
  const BetNumberSecretAnswer = new web3.eth.Contract(contracts.BetNumberSecretAnswer.abi as unknown as AbiItem, contracts.BetNumberSecretAnswer.address);
  const ascii85 = require('ascii85');

  async function decryptData(account: string, data: Buffer): Promise<Buffer> {
    const structuredData = {
      version: 'x25519-xsalsa20-poly1305',
      ephemPublicKey: data.slice(0, 32).toString('base64'),
      nonce: data.slice(32, 56).toString('base64'),
      ciphertext: data.slice(56).toString('base64'),
    };

    const ct = `0x${Buffer.from(JSON.stringify(structuredData), 'utf8').toString('hex')}`;

    const decrypt = await window.ethereum?.request({
      method: 'eth_decrypt',
      params: [ct, account],
    });

    return ascii85.decode(decrypt).toString();
  }

  const getEncryptedData = async () => {
    try {
      const guessStorageId = betId + guessId.toString()
      setEncryptedData(await BetNumberSecretAnswer.methods.getSecretEncryptedData(guessStorageId).call());
    } catch {
      return false;
    }
  }

  useEffect(() => {
    getEncryptedData();
  }, []);

  const getGuess = async () => {
    const provider = (await detectEthereumProvider()) as any;

    if (provider) {
      if (!secretBet){
        setGuess(convertToGuess(await betNumber.methods.getGuess(betId, guessId).call()));
      } else {
        setGuess(convertToGuess(await betNumberSecretAnswer.methods.getGuess(betId, guessId).call()));
      }
    } else {
      console.log("Please install MetaMask!");
    }
  }

  const getBet = async () => {
    const provider = (await detectEthereumProvider()) as any;

    if (provider) {if (!secretBet){
      setBet(convertToBet(await betNumber.methods.getBet(betId).call()));
    } else {
      setBet(convertToBet(await betNumberSecretAnswer.methods.getBet(betId).call()));
    }
  } else {
    console.log("Please install MetaMask!");
  }
}

const revealGuess = async () => {
  const provider = (await detectEthereumProvider()) as any;

  if (provider) {

    // @ts-ignore
    const decryptedData = await decryptData(user, Buffer.from(web3.utils.hexToBytes(encryptedData), 'utf8'));
    const revealedGuess = decryptedData.toString().split(',')[0];
    const nonce = decryptedData.toString().split(',')[1];
    const guessIdString = guessId!.toString();

    BetNumberSecretAnswer.methods.revealGuess(betId, guessIdString, revealedGuess, nonce)
    .estimateGas({ from: provider.selectedAddress, value: 0 }, async function (error: any) {
      if (error === null) {
        const count = await web3.eth.getTransactionCount(provider.selectedAddress);
        console.log(provider.selectedAddress, 'getTransactionCount:', count.toString(10));

        try {
          await provider.request({
            method: 'eth_sendTransaction',
            params: [{
              from: provider.selectedAddress,
              to: contracts.BetNumberSecretAnswer.address,
              value: (0).toString(16),
              data: web3.eth.abi.encodeFunctionCall({
                name: 'revealGuess',
                type: 'function',
                inputs: [{
                  name: 'betId',
                  type: 'string',
                }, {
                  name: 'guessId',
                  type: 'uint256',
                }, {
                  name: 'revealedGuess',
                  type: 'int256',
                }, {
                  name: 'nonce',
                  type: 'int256',
                }],
              }, [betId, guessIdString, revealedGuess, nonce]),
              chainId: 31337,
            },],
          });
          showNotification({
            autoClose: 10000,
            title: "Your guess has been revealed successfully",
            message: null,
            color: 'teal',
            icon: <IconCheck />
          });

          return true;
        } catch {
          return false;
        }
      } else {
        showNotification({
          autoClose: 10000,
          title: "Operation unsuccessful",
          message: String(error).split('\'')[1],
          color: 'red',
          icon: <IconX />
        });
      }
    });
    } else {
      console.log("Please install MetaMask!");
    }
  }


  useEffect(() => {
    if (isConnected === true) {
      getGuess();
      getBet();
    }
  }, [isConnected]);

  if(bet != undefined && guess != undefined){
    if (secretBet){
      return (
        <Card>
          <div className={classes.horizontalContainer}>
          <Text size='xl' weight={700}>
            {bet.name}
          </Text>

          {(bet.status == Status.Active && bet.bettingDeadline != undefined && new Date() < bet.bettingDeadline) && <Text color="teal">Active</Text>}
          {(bet.status == Status.Active && bet.bettingDeadline != undefined && new Date() > bet.bettingDeadline) && <Text color="yellow">Pending</Text>}
          {(bet.status == Status.Revealed && bet.bettingDeadline != undefined && new Date() > bet.bettingDeadline) && <Text color="orange">Answer Revealed</Text>}
          {bet.status == Status.Finished && <Text color="red">Finished</Text>}
        </div>
        <SimpleGrid cols={2}>
          <div>
          <Group spacing="xs">
            <NameValue name="Bet ID" value={bet.id.substring(0, 5) + '...' + bet.id.substring(31, 36)}/>

            <CopyButton value={bet.id!} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="bottom">
                  <ActionIcon
                    color={copied ? 'teal' : 'gray'}
                    onClick={copy}
                    sx={{ marginLeft: '-6px' }}
                  >
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
            <NameValue name="Bet Name" value={bet.name}/>
            <NameValue name="Amount" value={guess.amount}/>
            {
              (guess.evaluated) &&
              <NameValue name="Your Guess" value={guess.guess}/>
            }
            {
              (!guess.evaluated) &&
              <NameValue name="Your Guess" value={"Encrypted"}/>
            }
            {
              (!guess.evaluated && (bet.status == Status.Revealed)) &&
              <Button 
                variant="subtle"
                onClick={() => revealGuess()}
              >
                Reveal Guess
              </Button>
            }

          </div>
          <div>
            <NameValue name="Betting Deadline" value={renderDate(bet.bettingDeadline)}/>
            <NameValue name="Answer Reveal Deadline" value={renderDate(bet.answerRevealDeadline)}/>
            <NameValue name="Claim Prize Deadline" value={renderDate(bet.prizeClaimDeadline)}/>
            <NameValue name="Status" value={bet.status}/>
          </div>
        </SimpleGrid>
        </Card>
      )
    } else {
      return (
        <Card>
          <div className={classes.horizontalContainer}>
          <Text size='xl' weight={700}>
            {bet.name}
          </Text>

          {(bet.status == Status.Active && bet.bettingDeadline != undefined && new Date() < bet.bettingDeadline) && <Text color="teal">Active</Text>}
          {(bet.status == Status.Active && bet.bettingDeadline != undefined && new Date() > bet.bettingDeadline) && <Text color="yellow">Pending</Text>}
          {(bet.status == Status.Revealed && bet.bettingDeadline != undefined && new Date() > bet.bettingDeadline) && <Text color="orange">Answer Revealed</Text>}
          {bet.status == Status.Finished && <Text color="red">Finished</Text>}
        </div>
        <SimpleGrid cols={2}>
          <div>
          <Group spacing="xs">
            <NameValue name="Bet ID" value={bet.id.substring(0, 5) + '...' + bet.id.substring(31, 36)}/>

            <CopyButton value={bet.id!} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="bottom">
                  <ActionIcon
                    color={copied ? 'teal' : 'gray'}
                    onClick={copy}
                    sx={{ marginLeft: '-6px' }}
                  >
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
            <NameValue name="Bet Name" value={bet.name}/>
            <NameValue name="Amount" value={guess.amount}/>
            <NameValue name="Your Guess" value={guess.guess}/>
          </div>
          <div>
            <NameValue name="Betting Deadline" value={renderDate(bet.bettingDeadline)}/>
            <NameValue name="Answer Reveal Deadline" value={renderDate(bet.answerRevealDeadline)}/>
            <NameValue name="Status" value={bet.status}/>
          </div>
        </SimpleGrid>
        </Card>
      )
    }

  }
  return null;
}
