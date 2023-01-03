import { useStyles } from './styles';
import { useState } from 'react';
import { CopyButton, Tooltip, ActionIcon, Button, Text, Collapse, Group, Modal } from '@mantine/core';
import { IconCheck, IconCopy, IconChevronRight, IconFilePlus } from '@tabler/icons';
import TopUp from '../TopUp';
import ForceFinish from '../ForceFinish';
import WhitelistAddress from '../WhitelistAddress';
import RevealNumber from '../RevealNumber';
import GetGuesses from '../GetGuesses';
import Card from '../Card';
import CollapsibleArea from '../CollapsibleArea';
import Bet from '../Bet';

interface DisplayBetProps {
  user: string;
  id?: string;
  name?: string;
  description?: string;
  totalBets?: string;
  betLimit?: string;
  owner?: string;
  course?: string;
  bettingDeadline?: string;
  answerRevealDeadline?: string;
  status?: any;
  options?: any;
  hasRestrictedOptions?: boolean;
  answer: number;
}

export default function DisplayBet({
  user,
  id,
  name,
  description,
  totalBets,
  betLimit,
  owner,
  course,
  bettingDeadline,
  answerRevealDeadline,
  status,
  options,
  hasRestrictedOptions,
  answer
}: DisplayBetProps) {
  const { classes, cx, theme } = useStyles();

  const [revealModalOpened, setRevealModalOpened] = useState(false);
  const [guessModalOpened, setGuessModalOpened] = useState(false);
  const [controlsOpened, setControlsOpened] = useState(false);
  const renderForceFinishButton = () => {
    if (id != undefined &&
      status != undefined &&
      answerRevealDeadline != undefined &&
      status == 1 &&
      Date.now() > parseInt(answerRevealDeadline) * 1000) {
      return (
        <ForceFinish
          betId={id}
          secretBet={false}
        />
      )
    }
  }

  const renderIntValues = (inputs: string) => {
    if (inputs !== undefined) {
      const inputValue = parseInt(inputs);

      if (inputValue < 10 ** 13) {
        return (
          <>
            {`${inputValue} Wei`}
          </>
        )
      } else {
        return (
          <>
            {`${Math.round(inputValue / 10 ** 18 * 100000) / 100000} ETH`}
          </>
        )
      }
    }
  }

  const renderDate = (inputs: string) => {
    if (inputs !== undefined) {
      var d = new Date(0);
      d.setUTCSeconds(parseInt(inputs));
      return (
        <>
          {`${d.toLocaleTimeString()} ${d.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}`}
        </>
      )
    }
  }

  const renderRevealButton = () => {
    if (user.toLowerCase() == owner?.toLowerCase() &&
      id != undefined &&
      bettingDeadline != undefined &&
      answerRevealDeadline != undefined &&
      status != 4 &&
      Date.now() > parseInt(bettingDeadline) * 1000 &&
      Date.now() <= parseInt(answerRevealDeadline) * 1000) {
      return (
        <>
          <RevealNumber
            betId={id}
            user={user}
          />
        </>
      )
    }
  }

  const renderOptions = () => {
    var array = '';
    if (options !== undefined) {
      for (var i = 0; i < options.length; i++) {
        array += options[i][0]
        if (i !== options.length - 1) {
          array += ', '
        }
      }
    }
    return array
  }

  return (
    <Card>
      <div className={classes.horizontalContainer}>
        <Text size='xl' weight={700}>
          {name}
        </Text>

        {(status == 1 && bettingDeadline != undefined && Date.now() < parseInt(bettingDeadline) * 1000) && <Text color="teal">Active</Text>}
        {(status == 1 && bettingDeadline != undefined && Date.now() > parseInt(bettingDeadline) * 1000) && <Text color="yellow">Pending</Text>}
        {(status == 3 && bettingDeadline != undefined && Date.now() > parseInt(bettingDeadline) * 1000) && <Text color="orange">Answer Revealed</Text>}
        {status == 4 && <Text color="red">Finished</Text>}
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
          <Text size="sm" color={theme.colors.gray[5]}>
            Total Volume
          </Text>

          <Text>
            {renderIntValues(totalBets!)}
          </Text>

          <Text size="sm" color={theme.colors.gray[5]}>
            Betting Deadline
          </Text>

          <Text>
            {renderDate(bettingDeadline!)}
          </Text>

          <Text size="sm" color={theme.colors.gray[5]}>
            Answer Reveal Deadline
          </Text>

          <Text>
            {renderDate(answerRevealDeadline!)}
          </Text>

          <Text size="sm" color={theme.colors.gray[5]}>
            Bet Limit
          </Text>

          <Text>
            {renderIntValues(betLimit!)}
          </Text>

          <Text size="sm" color={theme.colors.gray[5]}>
            Bet ID
          </Text>

          <Group spacing="xs">
            <Text>
              {id!.substring(0, 5) + '...' + id!.substring(31, 36)}
            </Text>

            <CopyButton value={id!} timeout={2000}>
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

            {(status==4 || (status == 3 && bettingDeadline != undefined && Date.now() > parseInt(bettingDeadline) * 1000)) && <Text size="sm" color={theme.colors.gray[5]}>Answer</Text> }
            {(status==4 || (status == 3 && bettingDeadline != undefined && Date.now() > parseInt(bettingDeadline) * 1000)) && <Text>{answer}</Text>}

          </Group>
        </div>

        <div className={classes.verticalContainer}>
          {
            (hasRestrictedOptions) &&
            <div>
              <Text
                size="sm"
                color={theme.colors.gray[5]}
              >
                Available Options
              </Text>

              <Text>
                {renderOptions()}
              </Text>
            </div>
          }

          {renderRevealButton()}

          {renderForceFinishButton()}

          <Button
            onClick={() => setControlsOpened((o) => !o)}
            variant="subtle"
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
            {user.toLowerCase() == owner?.toLowerCase() ? 'Controls' : 'Guesses'}
          </Button>
        </div>
      </div>

      <Collapse
        in={controlsOpened}
        transitionDuration={200}
      >
        {(user.toLowerCase() != owner?.toLowerCase() && id != undefined && bettingDeadline != undefined) &&
          <>
            {Date.now() < parseInt(bettingDeadline) * 1000 &&
              <>
                <Modal
                  opened={guessModalOpened}
                  onClose={() => setGuessModalOpened(false)}
                  title="New guess"
                >
                  <Bet betId={id} />
                </Modal>

                <div className={classes.horizontalContainerRight}>
                  <Button onClick={() => setGuessModalOpened(true)} leftIcon={<IconFilePlus size={20} stroke={1.5} />}>
                    New Guess
                  </Button>
                </div>
              </>
            }
            <div className={classes.columnWrapper}>
              <GetGuesses
                betId={id!}
                totalBets={totalBets!}
                secretBet={false}
                user={user}
              />
            </div>
          </>
        }

        {user.toLowerCase() == owner?.toLowerCase() &&
          <>
            <CollapsibleArea title="Guesses">
              <GetGuesses
                betId={id!}
                totalBets={totalBets!}
                secretBet={false}
                user={user}
              />
            </CollapsibleArea>

            <TopUp
              betId={id!}
              secretBet={false}
            />

            <WhitelistAddress
              betId={id!}
              secretBet={false}
            />
          </>
        }
      </Collapse>
    </Card>
  )
}
