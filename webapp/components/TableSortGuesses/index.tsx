import { useState } from 'react';
import {
  createStyles,
  Table,
  ScrollArea,
  UnstyledButton,
  Group,
  Text,
  Center,
  TextInput,
  CopyButton,
  Tooltip,
  ActionIcon
} from '@mantine/core';
import { keys } from '@mantine/utils';
import { IconSelector, IconChevronDown, IconChevronUp, IconSearch, IconCheck, IconCopy } from '@tabler/icons';

const useStyles = createStyles((theme) => ({
  th: {
    padding: '0 !important',
  },

  control: {
    width: '100%',
    padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,

    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
    },
  },

  icon: {
    width: 21,
    height: 21,
    borderRadius: 21,
  },
}));

interface RowData {
  fullBettor: string;
  bettor: string;
  amount: string;
  guess: string;
}

interface TableSortGuessesProps {
  data: RowData[];
}

interface ThProps {
  children: React.ReactNode;
  reversed: boolean;
  sorted: boolean;
  onSort(): void;
}

function Th({ children, reversed, sorted, onSort }: ThProps) {
  const { classes } = useStyles();
  const Icon = sorted ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector;
  return (
    <th className={classes.th}>
      <UnstyledButton onClick={onSort} className={classes.control}>
        <Group position="apart">
          <Text weight={500} size="sm">
            {children}
          </Text>
          <Center className={classes.icon}>
            <Icon size={14} stroke={1.5} />
          </Center>
        </Group>
      </UnstyledButton>
    </th>
  );
}

function filterData(data: RowData[], search: string) {
  const query = search.toLowerCase().trim();
  return data.filter((item) =>
    keys(data[0]).some((key) => item[key].toLowerCase().includes(query))
  );
}

function sortData(
  data: RowData[],
  payload: { sortBy: keyof RowData | null; reversed: boolean; search: string }
) {
  const { sortBy } = payload;

  if (!sortBy) {
    return filterData(data, payload.search);
  }

  return filterData(
    [...data].sort((a, b) => {
      if (payload.reversed) {
        if (parseInt(a[sortBy]) != NaN) {
          if (a[sortBy].includes('.'))
            return (parseFloat(b[sortBy]) * 100).toString().localeCompare((parseFloat(a[sortBy]) * 100).toString(), 'en', { numeric: true });
          else
            return b[sortBy].localeCompare(a[sortBy], 'en', { numeric: true });
        } else {
          return b[sortBy].localeCompare(a[sortBy]);
        }
      }

      if (parseInt(a[sortBy]) != NaN) {
        if (a[sortBy].includes('.'))
          return (parseFloat(a[sortBy]) * 100).toString().localeCompare((parseFloat(b[sortBy]) * 100).toString(), 'en', { numeric: true });
        else
          return a[sortBy].localeCompare(b[sortBy], 'en', { numeric: true });
      } else {
        return a[sortBy].localeCompare(b[sortBy]);
      }
    }),
    payload.search
  );
}

export default function TableSortGuesses({ data }: TableSortGuessesProps) {
  const [search, setSearch] = useState('');
  const [sortedData, setSortedData] = useState(data);
  const [sortBy, setSortBy] = useState<keyof RowData | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  const setSorting = (field: keyof RowData) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
    setSortedData(sortData(data, { sortBy: field, reversed, search }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setSearch(value);
    setSortedData(sortData(data, { sortBy, reversed: reverseSortDirection, search: value }));
  };

  const rows = sortedData.map((row, index) => (
    <tr key={index}>
      <td>
        <Group spacing="xs">
          <Text>
            {row.bettor}
          </Text>

          <CopyButton value={row.fullBettor} timeout={2000}>
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
      </td>
      <td>{row.amount}</td>
      <td>{row.guess}</td>
    </tr>
  ));

  return (
    <ScrollArea sx={{
      minWidth: 300,
      width: '100%',
      marginBottom: '10px'
    }}>
      <TextInput
        placeholder="Search by any field"
        mb="md"
        icon={<IconSearch size={14} stroke={1.5} />}
        value={search}
        onChange={handleSearchChange}
      />
      <Table
        horizontalSpacing="xs"
        verticalSpacing="xs"
        striped
        sx={{ minWidth: 300 }}
      >
        <thead>
          <tr>
            <Th
              sorted={sortBy === 'bettor'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('bettor')}
            >
              Bettor
            </Th>
            <Th
              sorted={sortBy === 'amount'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('amount')}
            >
              Amount
            </Th>
            <Th
              sorted={sortBy === 'guess'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('guess')}
            >
              Guess
            </Th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <tr>
              <td colSpan={Object.keys(data[0]).length}>
                <Text weight={500} align="center">
                  Nothing found
                </Text>
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </ScrollArea>
  );
}
