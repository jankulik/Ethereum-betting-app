import { DatePicker, TimeInput } from '@mantine/dates';
import { Button, Textarea, TextInput, MultiSelect } from '@mantine/core'
import { showNotification } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { useStyles } from './styles';
import { IconCalendar, IconClock, IconX, IconCheck, IconAt, IconGavel } from '@tabler/icons';
import detectEthereumProvider from '@metamask/detect-provider';
import blockchainnet from '../../blockchainnet.json';
import contracts from '../../contracts.json';
import { AbiItem } from 'web3-utils'
import Web3 from 'web3';
import AmountInput from '../AmountInput';
import { encrypt } from '@metamask/eth-sig-util';
import Card from '../Card';

interface CreateBetMarketProps {
  isConnected: boolean,
}

export default function CreateBetMarket({ isConnected }: CreateBetMarketProps) {
  const { classes, cx } = useStyles();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [arbitrator, setArbitrator] = useState('');
  const [betValue, setBetValue] = useState<number>();
  const [options, setOptions] = useState<Array<string>>([]);
  const [optionsData, setOptionsData] = useState([
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' },
  ]);

  const [deadlineDate, setDeadlineDate] = useState<Date>();
  const [deadlineTime, setDeadlineTime] = useState<Date>();
  const [deadlineTimestamp, setDeadlineTimestamp] = useState(0);
  const [revealDate, setRevealDate] = useState<Date>();
  const [revealTime, setRevealTime] = useState<Date>();
  const [revealTimestamp, setRevealTimestamp] = useState(0);

  const [nameError, setNameError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [arbitratorError, setArbitratorError] = useState('');
  const [deadlineTimestampError, setDeadlineTimestampError] = useState('');
  const [revealTimestampError, setRevealTimestampError] = useState('');
  const [betValueError, setBetValueError] = useState('');
  const [optionsError, setOptionsError] = useState('');

  const Testnet = blockchainnet.Testnet;
  const TestnetRpc = blockchainnet.TestnetRpc;

  const web3 = new Web3((Web3 as any).currentProvider || new Web3.providers.HttpProvider(TestnetRpc));
  const BetMarket = new web3.eth.Contract(contracts.BetMarket.abi as unknown as AbiItem, contracts.BetMarket.address);

  const ascii85 = require('ascii85');
  const { v4: uuidv4 } = require('uuid');

  const handleNewBetValue = (newBetValue: number) => setBetValue(newBetValue);

  var deadline = deadlineDate;
  deadlineTime?.getHours() !== undefined && deadline?.setHours(deadlineTime?.getHours());
  deadlineTime?.getMinutes() !== undefined && deadline?.setMinutes(deadlineTime?.getMinutes());
  deadlineTime?.getSeconds() !== undefined && deadline?.setSeconds(deadlineTime?.getSeconds());

  var reveal = revealDate;
  revealTime?.getHours() !== undefined && reveal?.setHours(revealTime?.getHours());
  revealTime?.getMinutes() !== undefined && reveal?.setMinutes(revealTime?.getMinutes());
  revealTime?.getSeconds() !== undefined && reveal?.setSeconds(revealTime?.getSeconds());

  useEffect(() => {
    deadline?.getTime() !== undefined && setDeadlineTimestamp(deadline?.getTime() / 1000);
  }, [deadline?.getTime()])

  useEffect(() => {
    reveal?.getTime() !== undefined && setRevealTimestamp(reveal?.getTime() / 1000);
  }, [reveal?.getTime()])

  const handleCreateBet = async () => {
    setNameError('');
    setDescriptionError('');
    setBetValueError('');
    setOptionsError('');
    setDeadlineTimestampError('');
    setRevealTimestampError('');
    setArbitratorError('');
    
    const addressValidationRegex = /^0x[a-fA-F0-9]{40}$/i;

    if (name === '')
      setNameError('Name must be defined');
    if (description === '')
      setDescriptionError('Description must be defined');
    if (betValue === 0)
      setBetValueError('Bet value must be greater than 0');
    if (betValue === undefined)
      setBetValueError('Bet value must be defined');
    if (options.length < 2)
      setOptionsError('There must be at least two possible outcomes');
    if (deadlineTimestamp < Math.floor(Date.now() / 1000))
      setDeadlineTimestampError('Deadline must be in the future');
    if (revealTimestamp < Math.floor(Date.now() / 1000))
      setRevealTimestampError('Reveal must be in the future');
    if (deadlineTimestamp >= revealTimestamp)
      setRevealTimestampError('Reveal must be later than the deadline');
    if (!addressValidationRegex.test(arbitrator))
      setArbitratorError('Arbitrator must be a valid Ethereum address');

    if (name !== '' &&
      description !== '' &&
      betValue !== 0 &&
      betValue !== undefined &&
      options.length >= 2 &&
      deadlineTimestamp > Math.floor(Date.now() / 1000) &&
      revealTimestamp > Math.floor(Date.now() / 1000) &&
      deadlineTimestamp < revealTimestamp &&
      addressValidationRegex.test(arbitrator)) {
      createBet();
    }
  }

  const createBet = async () => {
    const provider = (await detectEthereumProvider()) as any;

    const uuid = uuidv4();

    if (provider) {
      console.log("found provider", "provider.selectedAddress:" + provider.selectedAddress);

      BetMarket.methods.createBet(uuid, name, description, arbitrator, options, deadlineTimestamp, revealTimestamp)
        .estimateGas({ from: provider.selectedAddress, value: betValue }, async function (error: any) {
          if (error === null) {
            const count = await web3.eth.getTransactionCount(provider.selectedAddress);
            console.log(provider.selectedAddress, 'getTransactionCount:', count.toString(10));

            try {
              await provider.request({
                method: 'eth_sendTransaction',
                params: [{
                  from: provider.selectedAddress,
                  to: contracts.BetMarket.address,
                  value: betValue?.toString(16),
                  data: web3.eth.abi.encodeFunctionCall({
                    name: 'createBet',
                    type: 'function',
                    inputs: [{
                      name: 'id',
                      type: 'string',
                    }, {
                      name: 'name',
                      type: 'string',
                    }, {
                      name: 'description',
                      type: 'string',
                    }, {
                      name: 'arbitrator',
                      type: 'address'
                    }, {
                      name: 'options',
                      type: 'string[]',
                    }, {
                      name: 'bettingDeadline',
                      type: 'uint256',
                    }, {
                      name: 'answerRevealDeadline',
                      type: 'uint256',
                    }],
                  }, [uuid, name, description, arbitrator, options, deadlineTimestamp, revealTimestamp]),
                  chainId: 31337,
                },],
              });
              showNotification({
                autoClose: 10000,
                title: "Your bet has been created successfully",
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

  return (
    <Card>
      <div className={classes.columnWrapper}>
        <TextInput
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          label="Bet name"
          placeholder="Enter name"
          icon={<IconAt size={16} />}
          error={nameError ? nameError : false}
          styles={() => ({
            root: {
              width: '100%',
            },
          })}
        />

        <AmountInput
          betValueError={betValueError}
          label="Bet value"
          handleNewBetValue={handleNewBetValue}
        />

        <Textarea
          label="Bet description"
          placeholder="Enter description"
          value={description}
          onChange={(event) => setDescription(event.currentTarget.value)}
          autosize
          minRows={1}
          maxRows={4}
          error={descriptionError ? descriptionError : false}
          styles={() => ({
            root: {
              width: '100%',
            },
          })}
        />

        <MultiSelect
          label="Possible outcomes"
          placeholder="Type to add your own outcomes"
          value={options}
          onChange={setOptions}
          data={optionsData}
          searchable
          creatable
          error={optionsError ? optionsError : false}
          getCreateLabel={(query) => `+ Create ${query}`}
          onCreate={(query) => {
            const item = { value: query, label: query };
            setOptionsData((current) => [...current, item]);
            return item;
          }}
          styles={() => ({
            root: {
              width: '100%',
            },
          })}
        />

        <TextInput
          value={arbitrator}
          onChange={(event) => setArbitrator(event.currentTarget.value)}
          label="Bet arbitrator"
          placeholder="Enter address"
          icon={<IconGavel size={16} />}
          error={arbitratorError ? arbitratorError : false}
          styles={() => ({
            root: {
              width: '100%',
            },
          })}
        />

        <div className={classes.horizontalContainer}>
          <DatePicker
            value={deadlineDate}
            onChange={date => date !== null && setDeadlineDate(date)}
            placeholder="Pick a date"
            label="Betting deadline date"
            clearable={false}
            icon={<IconCalendar size={16} />}
            error={deadlineTimestampError ? deadlineTimestampError : false}
            styles={() => ({
              root: {
                marginTop: `${(revealTimestampError && !deadlineTimestampError) ? '-19px' : '0px'}`,
                marginRight: '5px',
                width: '100%',
              },
            })}
          />

          <DatePicker
            value={revealDate}
            onChange={date => date !== null && setRevealDate(date)}
            placeholder="Pick a date"
            label="Answer reveal date"
            clearable={false}
            icon={<IconCalendar size={16} />}
            error={revealTimestampError ? revealTimestampError : false}
            styles={() => ({
              root: {
                marginTop: `${(deadlineTimestampError && !revealTimestampError) ? '-19px' : '0px'}`,
                marginLeft: '5px',
                width: '100%',
              },
            })}
          />
        </div>

        <div className={classes.horizontalContainer}>
          <TimeInput
            value={deadlineTime}
            onChange={time => time !== null && setDeadlineTime(time)}
            label="Betting deadline time"
            withSeconds
            icon={<IconClock size={16} />}
            error={deadlineTimestampError ? deadlineTimestampError : false}
            styles={() => ({
              root: {
                marginTop: `${(revealTimestampError && !deadlineTimestampError) ? '-19px' : '0px'}`,
                marginRight: '5px',
                width: '100%',
              },
            })}
          />

          <TimeInput
            value={revealTime}
            onChange={time => time !== null && setRevealTime(time)}
            label="Answer reveal time"
            withSeconds
            icon={<IconClock size={16} />}
            error={revealTimestampError ? revealTimestampError : false}
            styles={() => ({
              root: {
                marginTop: `${(deadlineTimestampError && !revealTimestampError) ? '-19px' : '0px'}`,
                marginLeft: '5px',
                width: '100%',
              },
            })}
          />
        </div>

        <Button
          variant="subtle"
          onClick={handleCreateBet}
          disabled={!isConnected}
        >
          Create bet
        </Button>
      </div>
    </Card>
  )
}
