Iquidus Explorer
================

An open source block explorer.

### Requires

*  node.js >= 0.10.28
*  mongodb >= 2.6.0
*  *coind

### Get the source

    git clone https://github.com/iquidus/explorer explorer

### Install node modules

    cd explorer && npm install

### Configure

    cp ./settings.json.template ./settings.json

*Make required changes in settings.json*

### Start Explorer

    npm start

*note: mongod must be running to start the explorer*

### Syncing database with the blockchain

    node blocknotify.js

*It is recommend to have this script launched via a cronjob at block-time intervals. Or using the wallets blocknotify flag.*

### Wallet

Iquidus Explorer is intended to be generic so it can be used with any wallet following the usual standards. The wallet must running with atleast the following flags

    -daemon -txindex

### Donate

    BTC: 168hdKA3fkccPtkxnX8hBrsxNubvk4udJi
    DRK: XukjQSNUneDpeqLDtgpBtQnVwTAusSuacw

### Development

Current version: 1.0.0  
Next planned: 1.1.0  

*  Plugin/module support allowing for the injection of menu times (layout.jade), routes and plugin specific settings.
*  MintPal module (market page using mintpaljs)

### License

Copyright (c) 2014, Iquidus Technology  
Copyright (c) 2014, Luke Williams  
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Iquidus Technology nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

