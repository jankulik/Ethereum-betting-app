import { useStyles } from './styles';
import { useState } from 'react';
import { IconFilePlus, IconChevronDown } from '@tabler/icons';
import { Modal, Button, Select, Text, Center } from '@mantine/core';
import TableSortOrders from '../TableSortOrders';
import CreateOrder from '../CreateOrder';
import FillOrder from '../FillOrder';

interface DisplayMarketProps {
  betId: string,
  user: string,
  options: any,
  orders: any,
  bettingDeadline: any;
}

export default function DisplayMarket({ betId, user, options, orders, bettingDeadline }: DisplayMarketProps) {
  const { classes, cx } = useStyles();

  const [bestOrderId, setBestOrderId] = useState<number>();

  const [displayedOrders, setDisplayedOrders] = useState<string | null>('all');
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [fillModalOpened, setFillModalOpened] = useState(false);

  const openFillModal = (orderId: number) => {
    setCreateModalOpened(false);
    setFillModalOpened(true);
    setBestOrderId(orderId);
  }

  const passStatus = (status: number, owner: string, user: string) => {
    if (status == 0 && owner.toLowerCase() != user.toLowerCase())
      return 'Fill';
    else if (status == 0 && owner.toLowerCase() == user.toLowerCase())
      return 'Cancel';
    else if (status == 1)
      return 'Filled';
    else if (status == 2)
      return 'Cancelled';
    return '';
  }

  const renderOrders = () => {
    var tableElementsAll = [];
    for (var i = orders.length - 1; i >= 0; i--) {
      tableElementsAll.push({
        id: i.toString(),
        user: orders[i].creator.substring(0, 5) + '...' + orders[i].creator.substring(38, 42),
        option: options[orders[i].optionId],
        type: `${orders[i].orderType == 0 ? 'Buy' : 'Sell'}`,
        amountOTM: orders[i].amountOTM,
        amountWei: orders[i].amountWei,
        price: (Math.floor(orders[i].amountWei / orders[i].amountOTM * 100) / 100).toString(),
        status: `${passStatus(orders[i].status, orders[i].creator, user)}`
      });
    }

    var tableElementsMy = [];
    for (var i = orders.length - 1; i >= 0; i--) {
      if (orders[i].creator.toLowerCase() === user.toLowerCase()) {
        tableElementsMy.push({
          id: i.toString(),
          user: orders[i].creator.substring(0, 5) + '...' + orders[i].creator.substring(38, 42),
          option: options[orders[i].optionId],
          type: `${orders[i].orderType == 0 ? 'Buy' : 'Sell'}`,
          amountOTM: orders[i].amountOTM,
          amountWei: orders[i].amountWei,
          price: (Math.floor(orders[i].amountWei / orders[i].amountOTM * 100) / 100).toString(),
          status: `${passStatus(orders[i].status, orders[i].creator, user)}`
        });
      }
    }

    var tableElementsActive = [];
    for (var i = orders.length - 1; i >= 0; i--) {
      if (orders[i].status === '0') {
        tableElementsActive.push({
          id: i.toString(),
          user: orders[i].creator.substring(0, 5) + '...' + orders[i].creator.substring(38, 42),
          option: options[orders[i].optionId],
          type: `${orders[i].orderType == 0 ? 'Buy' : 'Sell'}`,
          amountOTM: orders[i].amountOTM,
          amountWei: orders[i].amountWei,
          price: (Math.floor(orders[i].amountWei / orders[i].amountOTM * 100) / 100).toString(),
          status: `${passStatus(orders[i].status, orders[i].creator, user)}`
        });
      }
    }

    var tableElementsFinished = [];
    for (var i = orders.length - 1; i >= 0; i--) {
      if (orders[i].status !== '0') {
        tableElementsFinished.push({
          id: i.toString(),
          user: orders[i].creator.substring(0, 5) + '...' + orders[i].creator.substring(38, 42),
          option: options[orders[i].optionId],
          type: `${orders[i].orderType == 0 ? 'Buy' : 'Sell'}`,
          amountOTM: orders[i].amountOTM,
          amountWei: orders[i].amountWei,
          price: (Math.floor(orders[i].amountWei / orders[i].amountOTM * 100) / 100).toString(),
          status: `${passStatus(orders[i].status, orders[i].creator, user)}`
        });
      }
    }

    if (tableElementsAll[0] !== undefined) {
      return (
        <>
          {(displayedOrders == 'all' && tableElementsAll.length != 0) && <TableSortOrders betId={betId} data={tableElementsAll} />}
          {(displayedOrders == 'my' && tableElementsMy.length != 0) && <TableSortOrders betId={betId} data={tableElementsMy} />}
          {(displayedOrders == 'active' && tableElementsActive.length != 0) && <TableSortOrders betId={betId} data={tableElementsActive} />}
          {(displayedOrders == 'finished' && tableElementsFinished.length != 0) && <TableSortOrders betId={betId} data={tableElementsFinished} />}
        </>
      )
    } else {
      return (
        <Center>
          <Text>
            There are no orders yet
          </Text>
        </Center>
      )
    }
  }

  return (
    <>
      <div className={classes.horizontalContainer}>
        <Select
          value={displayedOrders}
          onChange={setDisplayedOrders}
          sx={{ maxWidth: '146.98px' }}
          rightSection={<IconChevronDown size={14} />}
          rightSectionWidth={28}
          styles={{ rightSection: { pointerEvents: 'none' } }}
          data={[
            { value: 'all', label: 'All orders' },
            { value: 'my', label: 'My orders' },
            { value: 'active', label: 'Active orders' },
            { value: 'finished', label: 'Finished orders' },
          ]}
        />

        {
          Date.now() < bettingDeadline * 1000 &&
          <>
            <Modal
              opened={createModalOpened}
              onClose={() => setCreateModalOpened(false)}
              title="Create order"
            >
              <CreateOrder
                betId={betId}
                options={options}
                orders={orders}
                openFillModal={openFillModal}
              />
            </Modal>

            {
              bestOrderId != undefined &&
              <Modal
                opened={fillModalOpened}
                onClose={() => setFillModalOpened(false)}
                title="Fill order"
              >
                <FillOrder
                  betId={betId}
                  orderId={bestOrderId}
                  amountOTM={orders[bestOrderId].amountOTM}
                  amountWei={orders[bestOrderId].amountWei}
                  type={orders[bestOrderId].orderType}
                />
              </Modal>
            }

            <Button onClick={() => setCreateModalOpened(true)} leftIcon={<IconFilePlus size={20} stroke={1.5} />}>
              Create order
            </Button>
          </>
        }
      </div>

      {renderOrders()}
    </>
  )
}
