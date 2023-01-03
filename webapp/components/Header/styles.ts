import { createStyles } from "@mantine/core";

export const useStyles = createStyles((theme, _params, getRef) => ({
  root: {
    zIndex: 99,
    position: "sticky",
    top: 0,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: "1rem",
    paddingRight: "1rem",
    width: "100%",
    height: "60px",
    backgroundColor: "white",
    borderBottom: `1px solid ${theme.colors.gray[3]}`,
  },

  burger: {
    marginRight: "1rem",

    [theme.fn.largerThan("sm")]: {
      display: "none",
    },
  },

  leftContainer: {
    display: "flex",
    flex: "1 1 0",
    justifyContent: "flex-start",
    alignItems: "center",
  },

  navbar: {
    display: "inline-flex",
    flexDirection: "row",

    [`& a`]: {
      color: theme.black,
      margin: "0 0.2rem",
    },
  },

  navbarContainer: {
    display: "flex",
    flex: "3 1 0",
    justifyContent: "center",
    alignItems: "center",

    [theme.fn.smallerThan("sm")]: {
      display: "none",
    },
  },

  navbarItem: {
    padding: "0.2rem 0.6rem",
    borderRadius: theme.radius.sm,
    textDecoration: "none",

    "&:hover": {
      backgroundColor: theme.colors.gray[0],
    },
  },

  navbarItemActive: {
    "&, &:hover": {
      backgroundColor: theme.fn.variant({ variant: "light", color: theme.primaryColor }).background,
    },
  },

  signInButton: {
    display: "inline-block",
  },

  signInButtonContainer: {
    display: "flex",
    flex: "1 0 0",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  sidebar: {
    zIndex: 99,
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: "60px",
    width: "288px",
    left: "-288px",
    padding: "24px 16px",
    transition: "all 0.2s",
    minHeight: "calc(100vh - 60px)",
    backgroundColor: "white",
    borderRight: `1px solid ${theme.colors.gray[3]}`,
  },

  sidebarActive: {
    left: 0,
  },
}));