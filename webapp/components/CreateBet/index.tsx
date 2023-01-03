import { DatePicker, TimeInput } from '@mantine/dates';
import { Button, NumberInput, Textarea, TextInput, Checkbox } from '@mantine/core'
import { useEffect, useState } from 'react';
import { useStyles } from './styles';
import { IconCalendar, IconClock, IconListNumbers, IconArrowUp, IconX, IconCheck, IconAt } from '@tabler/icons';
import detectEthereumProvider from '@metamask/detect-provider';
import blockchainnet from '../../blockchainnet.json';
import contracts from '../../contracts.json';
import { AbiItem } from 'web3-utils'
import Web3 from 'web3';
import AmountInput from '../AmountInput';
import { showNotification } from '@mantine/notifications';
import { encrypt } from '@metamask/eth-sig-util';
import Card from '../Card';

interface CreateBetProps {
  isConnected: boolean,
}

export default function CreateBet({ isConnected }: CreateBetProps) {
  const { classes, cx } = useStyles();
  const [secretBetCheck, setSecretBetCheck] = useState(false);

  const [deadlineDate, setDeadlineDate] = useState<Date>();
  const [deadlineTime, setDeadlineTime] = useState<Date>();
  const [deadlineTimestamp, setDeadlineTimestamp] = useState(0);
  const [revealDate, setRevealDate] = useState<Date>();
  const [revealTime, setRevealTime] = useState<Date>();
  const [revealTimestamp, setRevealTimestamp] = useState(0);
  const [claimDate, setClaimDate] = useState<Date>();
  const [claimTime, setClaimTime] = useState<Date>();
  const [claimTimestamp, setClaimTimestamp] = useState(0);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [betValue, setBetValue] = useState<number>();
  const [course, setCourse] = useState<number>();
  const [bettedNumber, setBettedNumber] = useState<number>();

  const [whitelisted, setWhitelisted] = useState<string | undefined>();
  const [blacklisted, setBlacklisted] = useState<string | undefined>();
  const [restrictedOptions, setRestrictedOptions] = useState<string | undefined>();

  const [deadlineTimestampError, setDeadlineTimestampError] = useState('');
  const [revealTimestampError, setRevealTimestampError] = useState('');
  const [claimTimestampError, setClaimTimestampError] = useState('');
  const [nameError, setNameError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [betValueError, setBetValueError] = useState('');
  const [courseError, setCourseError] = useState('');
  const [bettedNumberError, setBettedNumberError] = useState('');
  const [restrictedOptionsError, setRestrictedOptionsError] = useState('');
  const [blacklistError, setBlacklistError] = useState('');

  const Testnet = blockchainnet.Testnet;
  const TestnetRpc = blockchainnet.TestnetRpc;

  const web3 = new Web3((Web3 as any).currentProvider || new Web3.providers.HttpProvider(TestnetRpc));
  const BetNumber = new web3.eth.Contract(contracts.BetNumber.abi as unknown as AbiItem, contracts.BetNumber.address);
  const BetNumberSecretAnswer = new web3.eth.Contract(contracts.BetNumberSecretAnswer.abi as unknown as AbiItem, contracts.BetNumberSecretAnswer.address);

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

  var claim = claimDate;
  claimTime?.getHours() !== undefined && claim?.setHours(claimTime?.getHours());
  claimTime?.getMinutes() !== undefined && claim?.setMinutes(claimTime?.getMinutes());
  claimTime?.getSeconds() !== undefined && claim?.setSeconds(claimTime?.getSeconds());

  useEffect(() => {
    deadline?.getTime() !== undefined && setDeadlineTimestamp(deadline?.getTime() / 1000);
  }, [deadline?.getTime()])

  useEffect(() => {
    reveal?.getTime() !== undefined && setRevealTimestamp(reveal?.getTime() / 1000);
  }, [reveal?.getTime()])

  useEffect(() => {
    claim?.getTime() !== undefined && setClaimTimestamp(claim?.getTime() / 1000);
  }, [claim?.getTime()])

  const onlyNumbers = (array: Array<any>) => {
    return array.every(element => {
      return !isNaN(element);
    });
  }

  const generateNonce = (len: number) => {
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < len; i++) {
      var index = Math.floor(Math.random() * charactersLength);

      while (i === 0 && index === 0) {
        index = Math.floor(Math.random() * charactersLength);
      }

      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }

  function encryptData(publicKey: Buffer, data: Buffer): string {
    const enc = encrypt({
      publicKey: publicKey.toString('base64'),
      data: ascii85.encode(data).toString(),
      version: 'x25519-xsalsa20-poly1305',
    });

    const buf = Buffer.concat([
      Buffer.from(enc.ephemPublicKey, 'base64'),
      Buffer.from(enc.nonce, 'base64'),
      Buffer.from(enc.ciphertext, 'base64'),
    ]);

    return web3.utils.bytesToHex(buf.toJSON().data);
  }

  const handleCreateBet = async () => {
    setDeadlineTimestampError('');
    setRevealTimestampError('');
    setClaimTimestampError('');
    setNameError('');
    setBetValueError('');
    setCourseError('');
    setBettedNumberError('');
    setRestrictedOptionsError('');
    setBlacklistError('');

    const isOnlyNumbers = restrictedOptions !== undefined && onlyNumbers(restrictedOptions.replace(/\n+$/, '').split(/\r?\n/).map(Number));
    const bettedNotInRestricted = (restrictedOptions !== undefined) ? !((restrictedOptions?.replace(/\n+$/, '').split(/\r?\n/).map(Number)).includes(bettedNumber as number)) : false;
    const blacklistCheck = ((whitelisted !== undefined && (whitelisted.length !== 1 && whitelisted[0] !== '')) && (blacklisted !== undefined && (blacklisted.length !== 1 && blacklisted[0] !== ''))) ? (whitelisted?.split(/\r?\n/)).some(r => (blacklisted?.split(/\r?\n/)).includes(r)) : false;
    if (deadlineTimestamp < Math.floor(Date.now() / 1000))
      setDeadlineTimestampError('Deadline date must be in the future');
    if (revealTimestamp < Math.floor(Date.now() / 1000))
      setRevealTimestampError('Reveal date must be in the future');
    if (secretBetCheck && (claimTimestamp < Math.floor(Date.now() / 1000)))
      setClaimTimestampError('Claim date must be in the future');
    if (deadlineTimestamp >= revealTimestamp)
      setRevealTimestampError('Reveal date must be later than the deadline date');
    if (secretBetCheck && (revealTimestamp >= claimTimestamp))
      setClaimTimestampError('Claim date must be later than the reveal date');
    if (name === '')
      setNameError('Name must be defined');
    if (description === '')
      setDescriptionError('Description must be defined');
    if (betValue === 0)
      setBetValueError('Bet value must be greater than 0');
    if (betValue === undefined)
      setBetValueError('Bet value must be defined');
    if (course === undefined)
      setCourseError('Course must be defined');
    if (!secretBetCheck && (bettedNumber === undefined))
      setBettedNumberError('Betted number must be defined');
    if (restrictedOptions !== undefined && !isOnlyNumbers)
      setRestrictedOptionsError('Restricted options must contain numbers only');
    if (!secretBetCheck){
      if (restrictedOptions !== undefined && restrictedOptions?.length !== 0 && bettedNotInRestricted)
        setRestrictedOptionsError('Betted number must be in restricted options');
    }
    if (blacklisted?.length !== 0 && blacklistCheck)
      setBlacklistError('Blacklist cannot contain whitelist addresses');

    if (secretBetCheck){
      if (deadlineTimestamp > Math.floor(Date.now() / 1000) &&
        revealTimestamp > Math.floor(Date.now() / 1000) &&
        claimTimestamp > Math.floor(Date.now() / 1000) &&
        deadlineTimestamp < revealTimestamp &&
        revealTimestamp < claimTimestamp &&
        name !== '' &&
        description !== '' &&
        betValue !== 0 &&
        betValue !== undefined &&
        course !== undefined &&
        (restrictedOptions === undefined || restrictedOptions?.length === 0 || isOnlyNumbers)) {
          console.log("in")
          createSecretBet();
      }
    } else {
      if (deadlineTimestamp > Math.floor(Date.now() / 1000) &&
        revealTimestamp > Math.floor(Date.now() / 1000) &&
        deadlineTimestamp < revealTimestamp &&
        name !== '' &&
        description !== '' &&
        betValue !== 0 &&
        betValue !== undefined &&
        course !== undefined &&
        bettedNumber !== undefined &&
        (restrictedOptions === undefined || restrictedOptions?.length === 0 || (isOnlyNumbers && !bettedNotInRestricted))) {
          createBet();
      }
    }
    
  }

  const createSecretBet = async () => {
    const provider = (await detectEthereumProvider()) as any;

    const uuid = uuidv4();

    const courseConverted = Math.floor(course! * Math.pow(10, 17)).toLocaleString('fullwide', { useGrouping: false });

    var whitelistedArray: Array<string> = [];
    var blacklistedArray: Array<string> = [];
    var restrictedOptionsArray: Array<number> = [];

    if (whitelisted !== undefined && (whitelisted.length !== 1 && whitelisted[0] !== ''))
      whitelistedArray = whitelisted?.split(/\r?\n/);
    if (blacklisted !== undefined && (blacklisted.length !== 1 && blacklisted[0] !== ''))
      blacklistedArray = blacklisted?.split(/\r?\n/);
    if (restrictedOptions !== undefined && restrictedOptions.length !== 1)
      restrictedOptionsArray = restrictedOptions?.replace(/\n+$/, '').split(/\r?\n/).map(Number);

    if (provider) {
      console.log("found provider", "provider.selectedAddress:" + provider.selectedAddress);

      BetNumberSecretAnswer.methods.createBet(uuid, name, description, courseConverted, deadlineTimestamp, revealTimestamp, claimTimestamp, whitelistedArray, blacklistedArray, restrictedOptionsArray)
        .estimateGas({ from: provider.selectedAddress, value: betValue }, async function (error: any) {
          if (error === null) {
            const count = await web3.eth.getTransactionCount(provider.selectedAddress);
            console.log(provider.selectedAddress, 'getTransactionCount:', count.toString(10));

            try {
              await provider.request({
                method: 'eth_sendTransaction',
                params: [{
                  from: provider.selectedAddress,
                  to: contracts.BetNumberSecretAnswer.address,
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
                      name: 'course',
                      type: 'uint256',
                    }, {
                      name: 'bettingDeadline',
                      type: 'uint256',
                    }, {
                      name: 'answerRevealDeadline',
                      type: 'uint256',
                    }, {
                      name: 'prizeClaimDeadline',
                      type: 'uint256',
                    }, {
                      name: 'whitelist',
                      type: 'address[]',
                    }, {
                      name: 'blacklist',
                      type: 'address[]',
                    }, {
                      name: 'restrictedOptions',
                      type: 'int256[]'
                    }],
                  }, [uuid, name, description, courseConverted, deadlineTimestamp, revealTimestamp, claimTimestamp, whitelistedArray, blacklistedArray, restrictedOptionsArray]),
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

  const createBet = async () => {
    const provider = (await detectEthereumProvider()) as any;

    var keyB64;
    try {
      keyB64 = await window.ethereum?.request({
        method: 'eth_getEncryptionPublicKey',
        params: [provider.selectedAddress],
      }) as string;
    } catch {
      return false;
    }
    const publicKey = Buffer.from(keyB64, 'base64');

    const uuid = uuidv4();
    const nonce = generateNonce(40);
    const valueToStore = web3.eth.abi.encodeParameters(['uint256', 'uint256'], [bettedNumber, nonce]);
    const localHash = web3.utils.soliditySha3(valueToStore);

    const encryptedData = encryptData(publicKey, Buffer.from(bettedNumber!.toString().concat(',', nonce.toString()), 'utf8'));

    const courseConverted = Math.floor(course! * Math.pow(10, 17)).toLocaleString('fullwide', { useGrouping: false });

    var whitelistedArray: Array<string> = [];
    var blacklistedArray: Array<string> = [];
    var restrictedOptionsArray: Array<number> = [];

    if (whitelisted !== undefined && (whitelisted.length !== 1 && whitelisted[0] !== ''))
      whitelistedArray = whitelisted?.split(/\r?\n/);
    if (blacklisted !== undefined && (blacklisted.length !== 1 && blacklisted[0] !== ''))
      blacklistedArray = blacklisted?.split(/\r?\n/);
    if (restrictedOptions !== undefined && restrictedOptions.length !== 1)
      restrictedOptionsArray = restrictedOptions?.replace(/\n+$/, '').split(/\r?\n/).map(Number);

    if (provider) {
      console.log("found provider", "provider.selectedAddress:" + provider.selectedAddress);

      BetNumber.methods.createBet(uuid, name, description, localHash, encryptedData, courseConverted, deadlineTimestamp, revealTimestamp, whitelistedArray, blacklistedArray, restrictedOptionsArray)
        .estimateGas({ from: provider.selectedAddress, value: betValue }, async function (error: any) {
          if (error === null) {
            const count = await web3.eth.getTransactionCount(provider.selectedAddress);
            console.log(provider.selectedAddress, 'getTransactionCount:', count.toString(10));

            try {
              await provider.request({
                method: 'eth_sendTransaction',
                params: [{
                  from: provider.selectedAddress,
                  to: contracts.BetNumber.address,
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
                      name: 'hash',
                      type: 'uint256',
                    }, {
                      name: 'encryptedData',
                      type: 'bytes'
                    }, {
                      name: 'course',
                      type: 'uint256',
                    }, {
                      name: 'bettingDeadline',
                      type: 'uint256',
                    }, {
                      name: 'answerRevealDeadline',
                      type: 'uint256',
                    }, {
                      name: 'whitelist',
                      type: 'address[]',
                    }, {
                      name: 'blacklist',
                      type: 'address[]',
                    }, {
                      name: 'restrictedOptions',
                      type: 'int256[]'
                    }],
                  }, [uuid, name, description, localHash, encryptedData, courseConverted, deadlineTimestamp, revealTimestamp, whitelistedArray, blacklistedArray, restrictedOptionsArray]),
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
        <div className={classes.horizontalContainer}>
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

          <div className={classes.checkBoxContainer}>
            <Checkbox
              checked={secretBetCheck} 
              onChange={(event) => (setSecretBetCheck(event.currentTarget.checked))}
              label="Create Secret Bet"
            />
          </div>
        </div>
        

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
        
        <NumberInput
          value={course}
          onChange={(value) => setCourse(value)}
          placeholder="Pick a number"
          label="Course"
          icon={<IconArrowUp size={16} />}
          min={0}
          precision={2}
          error={courseError ? courseError : false}
          styles={() => ({
            root: {
              width: '100%',
            },
          })}
        />

        {
          (!secretBetCheck) &&
            <NumberInput
              value={bettedNumber}
              onChange={(value) => setBettedNumber(value)}
              placeholder="Pick a number"
              label="Betted number"
              icon={<IconListNumbers size={16} />}
              error={bettedNumberError ? bettedNumberError : false}
              styles={() => ({
                root: {
                  width: '100%',
                },
              })}
            />
        }

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
        {
          (secretBetCheck) &&
          <div className={classes.verticalContainer}>
            <DatePicker
              value={claimDate}
              onChange={date => date !== null && setClaimDate(date)}
              placeholder="Pick a date"
              label="Prize claim deadline date"
              clearable={false}
              icon={<IconCalendar size={16} />}
              error={claimTimestampError ? claimTimestampError : false}
              styles={() => ({
                root: {
                  marginTop: '0px',
                  width: '100%',
                },
              })}
            />

            <TimeInput
              value={claimTime}
              onChange={time => time !== null && setClaimTime(time)}
              label="Prize claim deadline time"
              withSeconds
              icon={<IconClock size={16} />}
              error={claimTimestampError ? claimTimestampError : false}
              styles={() => ({
                root: {
                  marginTop: '19px',
                  width: '100%',
                },
              })}
            />
          </div>
        }
        <Textarea
          label="Restricted options"
          placeholder="Enter options separated with a new line"
          value={restrictedOptions}
          onChange={(event) => setRestrictedOptions(event.currentTarget.value)}
          autosize
          minRows={1}
          maxRows={4}
          error={restrictedOptionsError ? restrictedOptionsError : false}
          styles={() => ({
            root: {
              width: '100%',
            },
          })}
        />

        <Textarea
          label="Whitelist"
          placeholder="Enter addresses separated with a new line"
          value={whitelisted}
          onChange={(event) => setWhitelisted(event.currentTarget.value)}
          autosize
          minRows={1}
          maxRows={4}
          styles={() => ({
            root: {
              width: '100%',
            },
          })}
        />

        <Textarea
          label="Blacklist"
          placeholder="Enter addresses separated with a new line"
          value={blacklisted}
          onChange={(event) => setBlacklisted(event.currentTarget.value)}
          autosize
          minRows={1}
          maxRows={4}
          error={blacklistError ? blacklistError : false}
          styles={() => ({
            root: {
              width: '100%',
            },
          })}
        />

        <Button
          variant="subtle"
          onClick={handleCreateBet}
          disabled={!isConnected}
        >
          Create Bet
        </Button>
      </div>
    </Card>
  )
}
