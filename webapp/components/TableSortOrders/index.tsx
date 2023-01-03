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
  ActionIcon,
  Button,
  Modal,
} from '@mantine/core';
import { keys } from '@mantine/utils';
import { IconSelector, IconChevronDown, IconChevronUp, IconSearch, IconCheck, IconCopy } from '@tabler/icons';
import FillOrder from '../FillOrder';
import CancelOrder from '../CancelOrder';

const useStyles = createStyles((theme) => ({
  th: {
    padding: '0 !important',
  },

  control: {
    width: '100%',
    padding: '10px 5px',

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
  id: string;
  user: string;
  option: string;
  type: string;
  amountOTM: string;
  amountWei: string;
  price: string;
  status: string;
}

interface TableSortOrdersProps {
  betId: string;
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
        <Group position="apart" spacing="xs">
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
    keys(data[0]).some((key) => item[key].toString().toLowerCase().includes(query))
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

export default function TableSortOrders({ betId, data }: TableSortOrdersProps) {
  const [search, setSearch] = useState('');
  const [sortedData, setSortedData] = useState(data);
  const [sortBy, setSortBy] = useState<keyof RowData | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  const [modalsOpened, setModalsOpened] = useState(new Array<boolean>(data.length).fill(false));

  const modalsChange = (id: number) => {
    const updatedModalsOpened: Array<boolean> = modalsOpened.map((item, index) => index === id ? !item : item);
    setModalsOpened(updatedModalsOpened);
  }

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

  const rows = sortedData.map((row) => (
    <tr key={row.id}>
      <td>
        <Group spacing="xs">
          <Text>
            {row.user}
          </Text>

          <CopyButton value={row.user} timeout={2000}>
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
      <td>{row.option}</td>
      <td>{row.type}</td>
      <td>{row.amountOTM}</td>
      <td>{row.amountWei}</td>
      <td>{row.price}</td>
      <td>
        <Center>
          {
            row.status == 'Fill' &&
            <>
              <Modal
                opened={modalsOpened[parseInt(row.id)]}
                onClose={() => modalsChange(parseInt(row.id))}
                title="Fill order"
              >
                <FillOrder
                  betId={betId}
                  orderId={parseInt(row.id)}
                  amountOTM={parseInt(row.amountOTM)}
                  amountWei={parseInt(row.amountWei)}
                  type={row.type}
                />
              </Modal>

              <Button onClick={() => modalsChange(parseInt(row.id))} variant="subtle" compact>
                Fill
              </Button>
            </>
          }
          {
            row.status == 'Cancel' &&
            <CancelOrder
              betId={betId}
              orderId={parseInt(row.id)}
            />
          }
          {row.status == 'Filled' && <Text color="teal" weight={600}>Filled</Text>}
          {row.status == 'Cancelled' && <Text color="red" weight={600}>Cancelled</Text>}
        </Center>
      </td>
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
              sorted={sortBy === 'user'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('user')}
            >
              User
            </Th>
            <Th
              sorted={sortBy === 'option'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('option')}
            >
              Option
            </Th>
            <Th
              sorted={sortBy === 'type'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('type')}
            >
              Type
            </Th>
            <Th
              sorted={sortBy === 'amountOTM'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('amountOTM')}
            >
              Amount OTM
            </Th>
            <Th
              sorted={sortBy === 'amountWei'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('amountWei')}
            >
              Amount Wei
            </Th>
            <Th
              sorted={sortBy === 'price'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('price')}
            >
              Price
            </Th>
            <Th
              sorted={sortBy === 'status'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('status')}
            >
              Status
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
