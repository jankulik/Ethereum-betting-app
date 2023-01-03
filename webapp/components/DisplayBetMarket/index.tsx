import { useStyles } from './styles';
import { useState } from 'react';
import { CopyButton, Tooltip, ActionIcon, Button, Text, Collapse, Group, RingProgress, Modal } from '@mantine/core';
import { IconCheck, IconCopy, IconChevronRight } from '@tabler/icons';
import Card from '../Card';
import DisplayMarket from '../DisplayMarket';
import ResolveBetMarket from '../ResolveBetMarket';
import ForceFinishMarket from '../ForceFinishMarket';

interface DisplayBetMarketProps {
  user: string;
  id?: string;
  name?: string;
  description?: string;
  value?: number;
  owner?: string;
  arbitrator?: string;
  options?: string[];
  balances?: any;
  bettingDeadline?: number;
  answerRevealDeadline?: number;
  orders?: any;
  status?: number;
  winningOptionId?: number;
}

export default function DisplayBetMarket({
  user,
  id,
  name,
  description,
  value,
  owner,
  arbitrator,
  options,
  balances,
  bettingDeadline,
  answerRevealDeadline,
  orders,
  status,
  winningOptionId
}: DisplayBetMarketProps) {
  const { classes, cx, theme } = useStyles();

  const [controlsOpened, setControlsOpened] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);

  const renderValue = () => {
    if (value !== undefined) {
      if (value < 10 ** 13) {
        return (
          <>
            {`${value} Wei`}
          </>
        )
      } else {
        return (
          <>
            {`${Math.round(value / 10 ** 18 * 100000) / 100000} ETH`}
          </>
        )
      }
    }
  }

  const renderResolveButton = () => {
    if (user.toLowerCase() == arbitrator?.toLowerCase() &&
      id != undefined &&
      options != undefined &&
      bettingDeadline != undefined &&
      answerRevealDeadline != undefined &&
      status != 1 &&
      Date.now() > bettingDeadline * 1000 &&
      Date.now() <= answerRevealDeadline * 1000) {
      return (
        <>
          <Modal
            opened={modalOpened}
            onClose={() => setModalOpened(false)}
            title="Resolve bet"
          >
            <ResolveBetMarket
              betId={id}
              options={options}
            />
          </Modal>

          <Button onClick={() => setModalOpened(true)} variant='subtle'>
            Resolve bet
          </Button>
        </>
      )
    }
  }

  const renderForceFinishButton = () => {
    if (id != undefined &&
      status != undefined &&
      answerRevealDeadline != undefined &&
      status == 0 &&
      Date.now() > answerRevealDeadline * 1000) {
      return (
        <ForceFinishMarket
          betId={id}
        />
      )
    }
  }

  const renderDate = (timestamp: number) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const date = new Date(timestamp * 1000);

    return date.toLocaleTimeString() + ' ' + monthNames[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
  }

  const renderOptions = () => {
    if (options !== undefined && orders !== undefined) {
      const elements = options.map((option, index) => {
        var price = '-'
        var label = 'There are no finished orders yet';
        for (var i = orders.length - 1; i >= 0; i--) {
          if (parseInt(orders[i].optionId) === index && parseInt(orders[i].status) === 1) {
            price = (Math.round(orders[i].amountWei / orders[i].amountOTM * 100) / 100).toString();
            label = `The price of each outcome token is ${price} Wei`;
            break;
          }
        }

        var balance = 0;
        console.log(balances);
        for (var i = 0; i < balances.length; i++) {
          if (balances[i].user.toLowerCase() == user.toLowerCase())
            balance = balances[i].tokens[index];
        }

        return (
          <Group key={index}>
            <Tooltip.Floating label={label}>
              <RingProgress
                size={80}
                roundCaps
                thickness={8}
                sections={
                  price !== '-' ? [{ value: parseFloat(price) * 100, color: 'blue' }] : [{ value: 0, color: 'blue' }]
                }
                label={
                  <>
                    <Text
                      size="xs"
                      align="center"
                      color={theme.colors.gray[5]}
                      sx={{
                        marginBottom: '-5px'
                      }}
                    >
                      Price
                    </Text>
                    <Text color="blue" weight={700} align="center" size="md">
                      {price}
                    </Text>
                  </>
                }
              />
            </Tooltip.Floating>

            <div>
              <Text size='sm' color={theme.colors.gray[5]}>
                Option
              </Text>

              <Text>
                {option}
              </Text>
            </div>

            <div>
              <Text size='sm' color={theme.colors.gray[5]}>
                Balance
              </Text>

              <Text>
                {balance} OTM
              </Text>
            </div>

            {
              status == 1 &&
              <div>
                <Text size='sm' color={theme.colors.gray[5]}>
                  Value
                </Text>

                <Text>
                  {index == winningOptionId ? balance : 0} Wei
                </Text>
              </div>
            }
          </Group>
        )
      })

      return elements;
    }
  }

  const renderOutcome = () => {
    if (orders !== undefined && value != undefined && status == 1) {
      var totalInput = 0;
      var totalOutput = 0;

      if (owner?.toLowerCase() == user.toLowerCase())
        totalInput += value;

      for (var i = 0; i < orders.length; i++) {
        if (orders[i].orderType == '0' && orders[i].status == '1') {
          if (orders[i].creator.toLowerCase() == user.toLowerCase())
            totalInput += orders[i].amountWei;
          else if (orders[i].filler.toLowerCase() == user.toLowerCase())
            totalOutput += orders[i].amountWei;
        } else if (orders[i].orderType == '1' && orders[i].status == '1') {
          if (orders[i].creator.toLowerCase() == user.toLowerCase())
            totalOutput += orders[i].amountWei;
          else if (orders[i].filler.toLowerCase() == user.toLowerCase())
            totalInput += orders[i].amountWei;
        }
      }

      return (
        <Group>
          <div>
            <Text size='sm' color={theme.colors.gray[5]}>
              Total paid in
            </Text>

            <Text>
              {totalInput} Wei
            </Text>
          </div>

          <div>
            <Text size='sm' color={theme.colors.gray[5]}>
              Total paid out
            </Text>

            <Text>
              {totalOutput} Wei
            </Text>
          </div>

          <div>
            <Text size='sm' color={theme.colors.gray[5]}>
              Net profit
            </Text>

            <Text>
              {totalOutput - totalInput} Wei
            </Text>
          </div>
        </Group>
      )
    }
  }

  return (
    <Card>
      <div className={classes.horizontalContainer}>
        <Text size='xl' weight={700}>
          {name}
        </Text>

        {(status == 0 && bettingDeadline != undefined && Date.now() < bettingDeadline * 1000) && <Text color="teal">Active</Text>}
        {(status == 0 && bettingDeadline != undefined && Date.now() > bettingDeadline * 1000) && <Text color="yellow">Pending</Text>}
        {status == 1 && <Text color="red">Finished</Text>}
      </div>

      <Text>
        {description}
      </Text>
      <br />

      <div
        className={classes.horizontalContainer}
        style={{
          marginBottom: `${controlsOpened ? '20px' : '0px'}`,
          marginTop: '-6px',
          transition: 'all 0.2s',
        }}
      >
        <div>
          <Text size='sm' color={theme.colors.gray[5]}>
            Total Volume
          </Text>

          <Text>
            {renderValue()}
          </Text>

          <Text size='sm' color={theme.colors.gray[5]}>
            Betting deadline
          </Text>

          <Text>
            {bettingDeadline !== undefined && renderDate(bettingDeadline)}
          </Text>

          <Text size='sm' color={theme.colors.gray[5]}>
            Answer reveal deadline
          </Text>

          <Text>
            {answerRevealDeadline !== undefined && renderDate(answerRevealDeadline)}
          </Text>

          <Text size='sm' color={theme.colors.gray[5]}>
            Arbitrator
          </Text>

          <Group spacing='xs'>
            <Text>
              {arbitrator !== undefined && arbitrator.substring(0, 5) + '...' + arbitrator.substring(38, 42)}
            </Text>

            <CopyButton value={arbitrator!} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position='bottom'>
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

          <Text size='sm' color={theme.colors.gray[5]}>
            Bet ID
          </Text>

          <Group spacing='xs'>
            <Text>
              {id != undefined && id.substring(0, 5) + '...' + id.substring(31, 36)}
            </Text>

            <CopyButton value={id!} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position='bottom'>
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
        </div>

        <div className={classes.verticalContainer}>
          {renderResolveButton()}

          {renderOptions()}

          {renderOutcome()}

          {renderForceFinishButton()}

          <Button
            onClick={() => setControlsOpened((o) => !o)}
            variant='subtle'
            rightIcon={
              <IconChevronRight
                size={16}
                style={{
                  transform: controlsOpened ? `rotate(90deg)` : 'none',
                  transition: '0.2s',
                }}
              />
            }
          >
            Market
          </Button>
        </div>
      </div>

      <Collapse in={controlsOpened} transitionDuration={200}>
        {
          (id !== undefined && owner !== undefined && orders !== undefined) &&
          <DisplayMarket
            betId={id}
            user={user}
            options={options}
            orders={orders}
            bettingDeadline={bettingDeadline}
          />
        }
      </Collapse>
    </Card>
  )
}
