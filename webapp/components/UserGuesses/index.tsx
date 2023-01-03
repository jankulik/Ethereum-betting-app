import { useStyles } from './styles';
import BetNumberGuesses from '../BetNumberGuesses';
import { Select, Group } from '@mantine/core';
import { useState } from 'react';
import { IconChevronDown } from '@tabler/icons';
import BetMarketYourBets from '../BetMarketYourBets';

interface UserGuessesProps {
  isConnected: boolean,
  user: string,
}

export default function UserGuesses({ isConnected, user }: UserGuessesProps) {
  const { classes, cx } = useStyles();

  const [guessType, setGuessType] = useState<string | null>('all');
  const [betStatus, setBetStatus] = useState<string | null>('all');

  return (
    <div className={classes.wrapper}>
      <div className={classes.horizontalContainer}>
        <Group spacing="xs">
          <Select
            value={guessType}
            onChange={setGuessType}
            sx={{ maxWidth: '132.84px' }}
            rightSection={<IconChevronDown size={14} />}
            rightSectionWidth={28}
            styles={{ rightSection: { pointerEvents: 'none' } }}
            data={[
              { value: 'all', label: 'All types' },
              { value: 'market', label: 'Bet Market' },
              { value: 'number', label: 'Bet Number' },
            ]}
          />

          {guessType == 'market' &&
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
          }
        </Group>

        <div></div>
      </div>

      {
        (guessType != 'market') &&
        <BetNumberGuesses
          isConnected={isConnected}
          user={user}
        />
      }
      {
        (guessType != 'number') &&
        <BetMarketYourBets
          isConnected={isConnected}
          user={user}
          betStatus={betStatus}
        />
      }
    </div>
  )
}
