# CE4153-blockchain-project

This project demonstrates a decentralised application that allows its users to place different types of bets.

## Prerequisites
* [npx](https://www.npmjs.com/package/npx)
* [nodejs](https://nodejs.org/en/download/package-manager/)
* [npm](https://nodejs.org/en/download/package-manager/)
* Chrome browser
* [MetaMask wallet](https://chrome.google.com/webstore/category/extensions)

## Quick start

Step 1. clone the git repo and then install all dependent packages
```
git clone https://github.com/trebacz626/CE4153-blockchain-project.git
yarn install
```

Step 2. setup a blockchain test network and deploy all smart contracts
```
npx hardhat node
```

Step 3. open another terminal, go to the `webapp` folder, install all dependent packages and start the webapp
```
cd webapp
npm install
npm run dev
```

The website would hosted on your http://localhost:3000

## Troubleshooting

In case something stops working, try resetting the hardhat network. Then go to your MetaMask wallet &rarr; Settings &rarr; Advanced and reset your account.


## Additional Information
We realized too late that the ```forceFinishBet``` application might be causing probems if there are too many guesses for a given bet. The app was always supposed to be used in between friends, not big groups due to legality concerns. We developed an additional version of ```BetNumber``` contract called ```BetNumberNoForceFinish```, which solves mentioned concern. However due to the lack of time, we have not developed a frontend for it.

At one point we were also considering using red-black tree to store a ranking of most valued bets at a time, but we did not go forward with the idea, because it would introduce too much complexity and highly inrease gas usage. Nevertheless, we include an additional files in ```red_black_tree``` folder to show our work.