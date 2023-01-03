import { createStyles } from '@mantine/core';

export const useStyles = createStyles((theme, _params, getRef) => ({
  horizontalContainerRight: {
    display: 'flex',
    alignItems: 'end',
    justifyContent: 'end',
  },

  columnWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    rowGap: '12px',
  },

  horizontalContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },

  verticalContainer: {
    height: '240px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    flexDirection: 'column',
    flexGrow: 1,
    rowGap: '0px',
    maxWidth: '500px',
    marginLeft: '20px',
  },

  table: {
    boxShadow: `0 0 0 1px ${theme.colors.gray[4]}`,
    borderRadius: '10px',
  },
}));
