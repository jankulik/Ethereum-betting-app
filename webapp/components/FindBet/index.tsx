import { useStyles } from './styles';
import CollapsibleArea from '../CollapsibleArea';
import { useState } from 'react';
import { IconX, IconId } from '@tabler/icons';
import { TextInput, Button, Text, Collapse } from '@mantine/core';
import detectEthereumProvider from '@metamask/detect-provider';
import blockchainnet from '../../blockchainnet.json';
import contracts from '../../contracts.json';
import { AbiItem } from 'web3-utils'
import Web3 from 'web3';
import { showNotification } from '@mantine/notifications';
import Card from '../Card';
import GetGuesses from '../GetGuesses';
import Bet from '../Bet';
import TopUp from '../TopUp';
import DisplayBetMarket from '../DisplayBetMarket';
import DisplayBet from '../DisplayBet';
import DisplaySecretBet from '../DisplaySecretBet';

interface FindBetProps {
  isConnected: boolean,
  user: string,
}

export default function FindBet({ isConnected, user }: FindBetProps) {
  const { classes, cx } = useStyles();


  const [betId, setBetId] = useState<any>('');
  const [betIdError, setBetIdError] = useState('');

  const [controlsOpened, setControlsOpened] = useState(false);
  const [bet, setBet] = useState<any>();
  const [searchStatus, setSearchStatus] = useState('');

  const Testnet = blockchainnet.Testnet;
  const TestnetRpc = blockchainnet.TestnetRpc;

  const web3 = new Web3((Web3 as any).currentProvider || new Web3.providers.HttpProvider(TestnetRpc));
  const BetNumber = new web3.eth.Contract(contracts.BetNumber.abi as unknown as AbiItem, contracts.BetNumber.address);
  const BetMarket = new web3.eth.Contract(contracts.BetMarket.abi as unknown as AbiItem, contracts.BetMarket.address);
  const BetNumberSecretAnswer = new web3.eth.Contract(contracts.BetNumberSecretAnswer.abi as unknown as AbiItem, contracts.BetNumberSecretAnswer.address);

  const handleCheckBet = async () => {
    setBetIdError('');

    if (betId === '')
      setBetIdError('Bet ID must be defined');

    if (betId !== '') {
      checkBet();
    }
  }

  const checkBet = async () => {
    setSearchStatus('');

    try {
      setBet(await BetMarket.methods.getBet(betId).call());
    } catch {
      try {
        var fetchedBet = await BetNumberSecretAnswer.methods.getSecretBet(betId).call();

        if (fetchedBet[0] != '') {
          setBet(fetchedBet);
        } else {
          fetchedBet = await BetNumber.methods.getBet(betId).call();

          if (fetchedBet[0] != '') {
            setBet(fetchedBet);
          } else {
            setSearchStatus('This bet doesn\'t exist');
            setBet(undefined);
          }
        }
      } catch {
        const fetchedBet = await BetNumber.methods.getBet(betId).call();
  
        if (fetchedBet[0] != '') {
          setBet(fetchedBet);
        } else {
          setSearchStatus('This bet doesn\'t exist');
          setBet(undefined);
        }
      }
    }
  }

  return (
    <>
      <Card>
        <div className={classes.columnWrapper}>
          <Text weight={500}>
            Find bet by ID
          </Text>

          <TextInput
            value={betId}
            onChange={(event) => setBetId(event.currentTarget.value)}
            placeholder="Enter ID"
            label="Bet ID"
            icon={<IconId size={16} />}
            error={betIdError ? betIdError : false}
            styles={() => ({
              root: {
                width: '100%',
              },
            })}
          />

          <Button
            variant="subtle"
            onClick={handleCheckBet}
            disabled={!isConnected}
          >
            Find bet
          </Button>
        </div>
        {/* <Collapse
        in={controlsOpened}
        transitionDuration={200}
      >
        {bet !== undefined && displayBet()}
      </Collapse> */}
      </Card>

      {searchStatus != '' && <Text>{searchStatus}</Text>}

      {
        (bet != undefined && bet.id != '' && bet.orders != undefined) &&
        <DisplayBetMarket
          user={user}
          id={bet.id}
          name={bet.name}
          description={bet.description}
          value={bet.value}
          owner={bet.owner}
          arbitrator={bet.arbitrator}
          options={bet.options}
          balances={bet.balances}
          bettingDeadline={bet.bettingDeadline}
          answerRevealDeadline={bet.answerRevealDeadline}
          orders={bet.orders}
          status={bet.status}
        />
      }

      {
        (bet != undefined && bet.id != '' && bet.orders == undefined && bet.prizeClaimDeadline == 0) &&
        <DisplayBet
          user={user}
          {...bet}
        />
      }

      {
        (bet != undefined && bet.id != '' && bet.orders == undefined && bet.prizeClaimDeadline != 0) &&
          <DisplaySecretBet
            user={user}
            {...bet}
          />
      }
    </>
  )
}
