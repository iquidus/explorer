# IQUIDUS EXPLORER INSTALLATION ON VPS

## INTRO: switch from Bitpay Inishgt
기존의 Bitpay Insight를 사용하고 있었다. 나쁘지 않았다 하지만 bitcoin `v0.16` 이후에 `getinfo`가 삭제되었고 최신버젼에서는 Bitpay Insight를 더이상 사용할수없다. 그 대안으로 찾은것이 바로 IQUIDUS EXPLORER 이다. 다양한 기능을 제공하며 꽤 괜찮은 성능을 보여준다.

Bitpay Insight doesn't support after bitcoin v0.16
```js
info: insight server listening on port 3000 in development mode
error: ERROR  code=-32601, message=getinfo

This call was removed in version 0.16.0. Use the appropriate fields from:
- getblockchaininfo: blocks, difficulty, chain
- getnetworkinfo: version, protocolversion, timeoffset, connections, proxy, relayfee, warnings
- getwalletinfo: balance, keypoololdest, keypoolsize, paytxfee, unlocked_until, walletversion
```

## MAKE A VPS FIRST
```bash
ssh root@123.123.123.123
```

## SETUP

### locale all to `en_US.UTF-8`
```bash
export LANGUAGE="en_US.UTF-8" && \
echo 'LANGUAGE="en_US.UTF-8"' >> /etc/default/locale && \
echo 'LC_ALL="en_US.UTF-8"' >> /etc/default/locale
```

### timezone to `Asia/Seoul`
```bash
sudo timedatectl set-timezone Asia/Seoul
```
> LOGOUT/IN

### wallet depends
```bash
cd && \
sudo add-apt-repository ppa:bitcoin/bitcoin -y && \
sudo apt-get update -y && \
sudo apt-get install -y \
software-properties-common libdb4.8-dev libdb4.8++-dev build-essential libtool autotools-dev automake pkg-config libssl-dev libevent-dev bsdmainutils libboost-all-dev libminiupnpc-dev libzmq3-dev libqt5gui5 libqt5core5a libqt5dbus5 qttools5-dev qttools5-dev-tools libprotobuf-dev protobuf-compiler libqrencode-dev && \
cd
```

### wallet build
```bash
git clone git@github.com:cryptozeny/sugarchain-v0.16.3.git && \
cd sugarchain-v0.16.3/ && \
git checkout r4-yes-DGW-etc-brand-gene-icon && \
./autogen.sh && \
./configure && \
make -j$(nproc)
```

if your VPS doesn't have enough memory (under 1GB)
```bash
./configure CXXFLAGS="--param ggc-min-expand=1 --param ggc-min-heapsize=32768"
```

### wallet run: explorer needs `-txindex` 
for testing log `-printtoconsole` instead of `-daemon`
```bash
./src/sugarchaind -server=1 -rpcuser=username -rpcpassword=password -txindex -daemon
```

### Nodejs (explorer needs node v0.10.28)
```bash
cd && curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.9/install.sh | bash
```
> LOGOUT/IN

```bash
nvm ls-remote && \
nvm install v0.10.28 && \
nvm ls && \
node -v && \
nvm use v0.10.28
```
> LOGOUT/IN

### explorer depends
```bash
cd && \
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927 && \
echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list && \
sudo apt-get update && \
sudo apt-get install -y mongodb-org libkrb5-dev
```

### upstart for starting MongoDB
```bash
sudo apt-get install upstart-sysv -y
```
> REBOOT

### explorer DB start
```bash
sudo service mongod stop && \
sudo service mongod start

```

### explorer MongoDB create
```bash
mongo
> use explorerdb
> db.createUser( { user: "mongo-user", pwd: "mongo-pwd", roles: [ "readWrite" ] } )
> exit
```

#### option: drop MongoDB
```bash
use explorerdb;
db.dropDatabase();
db.dropUser("mongo-user")
```

### explorer install (branch master)
```bash
cd && \
git clone git@github.com:sugarchain-project/explorer.git explorer && \
cd explorer && npm install --production
```

### explorer settings
```bash
cp ./settings.json.sugarchain ./settings.json
```
> edit `./settings.json`

### explorer test-run (각각 다른 터미널에서)
```bash
npm start # term-1
node scripts/sync.js index update # term-2 (run twice)
```
> stop both

### forever for Nodejs
```bash
npm install forever -g
npm install forever-monitor
```

### explorer start
```
forever start bin/cluster
```

### explorer update every `15s` (sync.js peer.js)
update first
```bash
node scripts/sync.js index update && \
node scripts/sync.js market && \
node scripts/peers.js
```

update auto
```bash
while true; 
do touch tmp/index.pid && \
rm -f ./tmp/index.pid && \
node scripts/sync.js index update && \
node scripts/sync.js market && \
node scripts/peers.js; 
sleep 15.0; 
done
```

### run.sh as daemon
```bash
setsid ./run.sh > /dev/null 2>&1 < /dev/null &
```

### todo: cron & start.sh
cron  
https://github.com/cryptozeny/zny-nomp-kawaii  
start.sh  
https://gist.github.com/zeronug/5c66207c426a1d4d5c73cc872255c572  
