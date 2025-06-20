const log=(...args)=>{console.log(...args);};
const wrn=(...args)=>{console.warn(...args);};

const setupElem = document.querySelector('.setup');
const controlsElem = document.querySelector('.controls');
const commCardsElem = document.querySelector('.community-cards');
const potElem =	document.querySelector('.pot');
const statusElem =	document.querySelector('.status');
const tableElem = document.getElementById('poker-table')
const betRingElem = document.getElementById('bet-ring')
const numPlayersSelect = document.getElementById('num-players');
const playerTypesDiv = document.getElementById('player-types');

let playerTypes;

const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const deck = [];
for (let suit of suits) for (let rank of ranks) deck.push({ rank, suit });
let numPlayers;

let gameState = {//«
	num: 0,
	players: [],
	communityCards: [],
	pot: 0,
	currentPlayer: 0,
	dealer: 0,
	phase: 'setup',
	currentBet: 0,
	deck: [],
};//»

const curPlayer=()=>{return gameState.players[gameState.currentPlayer];};
const curType=()=>{return gameState.players[gameState.currentPlayer].type;};
const incCurPlayer=()=>{gameState.currentPlayer=(gameState.currentPlayer+1)% numPlayers;};
const curNum=()=>{return gameState.currentPlayer+1;};
const initPlayers=()=>{//«
	gameState.players = [];

	tableElem.querySelectorAll('.player').forEach(el => el.remove());

	const tableWidth = 800;
	const tableHeight = 400;
	const radiusX = tableWidth / 2;
	const radiusY = tableHeight / 2;
	const angleStep = (2 * Math.PI) / numPlayers;

	const betWidth = 500;
	const betHeight = 250;
	const betRadX = betWidth/2;
	const betRadY = betHeight/2;

	for (let i = 0; i < numPlayers; i++) {
		const angle = i * angleStep - Math.PI / 2;
		let player_off = 40;
		const player_x = radiusX + radiusX * Math.cos(angle) - player_off;
		const player_y = radiusY + radiusY * Math.sin(angle) - player_off;

		const bet_x = betRadX + betRadX * Math.cos(angle) - 20;
		const bet_y = betRadY + betRadY * Math.sin(angle) - 20;


		let but_angle_off = 0.25;
		const but_x = (tableWidth / 2) + radiusX * Math.cos(angle+but_angle_off);
		const but_y = (tableHeight / 2) + radiusY * Math.sin(angle+but_angle_off);
		const butDiv = document.createElement('div');
		butDiv.className = `dealer-button`;
		butDiv.id = `dealer-button-${i}`;
		butDiv.style.left = `${but_x}px`;
		butDiv.style.top = `${but_y}px`;

		const playerDiv = document.createElement('div');
		playerDiv.className = `player player-${i}`;
		playerDiv.style.left = `${player_x}px`;
		playerDiv.style.top = `${player_y}px`;

		const betDiv = document.createElement('div');
		betDiv.className = `bet`;
		betDiv.style.left = `${bet_x}px`;
		betDiv.style.top = `${bet_y}px`;

		tableElem.appendChild(playerDiv);
		tableElem.appendChild(butDiv);

		betRingElem.appendChild(betDiv);

		const player = {
			id: i,
			type: playerTypes[i],
			chips: 1000,
			hand: [],
			inHand: true,
			bet: 0,
			total: 0,
			strategy: playerTypes[i],
			allIn: false,
			betDiv
		};

		playerDiv.innerHTML = `Player ${i + 1}<br>$${player.chips}<div class="cards"></div>`;
		gameState.players.push(player);

	}
}//»
const startGame=()=>{//«

	numPlayers = parseInt(numPlayersSelect.value);
	wrn(`Starting game: ${gameState.num}`);
	if (playerTypes.length !== numPlayers) return;
	gameState.phase = 'preflop';
	gameState.deck = [...deck];
	shuffle(gameState.deck);
	initPlayers();
	dealHands();

	stat(`Player ${gameState.dealer+1} has the dealer button`);
	let butDiv = document.getElementById(`dealer-button-${gameState.dealer}`);
	butDiv.style.display="block";

	gameState.currentPlayer = (gameState.dealer + 1) % numPlayers;

	gameState.currentBet = 10;
	let sb_player = curPlayer();
	sb_player.chips -= Math.min(10, sb_player.chips);
	sb_player.bet = Math.min(10, sb_player.chips);
	sb_player.total = sb_player.bet;
	sb_player.betDiv.innerHTML = `${sb_player.bet}`;
	stat(`Player ${curNum()} bets ${sb_player.bet} in the small blind`);
	gameState.pot += Math.min(10, sb_player.chips);

	if (sb_player.chips === 0) {
		sb_player.allIn = true;
	}

	incCurPlayer();

	let bb_player = curPlayer();
	bb_player.chips -= Math.min(20, bb_player.chips);
	bb_player.bet = Math.min(20, bb_player.chips);
	bb_player.total = bb_player.bet;
	bb_player.betDiv.innerHTML = `${bb_player.bet}`;
	stat(`Player ${curNum()} bets ${bb_player.bet} in the big blind`);
	gameState.pot += Math.min(20, bb_player.chips);
	if (bb_player.chips === 0) {
		bb_player.allIn = true;
	}
	gameState.currentBet = 20;

	incCurPlayer();

	updatePlayerDisplay();
	updatePot();
	stat(`Player ${gameState.currentPlayer + 1}'s turn`);
	setupElem.style.display = 'none';
	if (curType() !== 'live' || curPlayer().allIn) {
		automatedAction();
	}
	else {
		controlsElem.style.display = 'flex';
	}
}//»
const shuffle=(array)=>{//«
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}//»
const dealCard=()=>{//«
	return gameState.deck.pop();
}//»
const updatePlayerDisplay=()=>{//«
	gameState.players.forEach((player, i) => {
		const playerDiv = document.querySelector(`.player-${i}`);
		if (playerDiv) {
			playerDiv.classList.toggle('active', i === gameState.currentPlayer && player.inHand && !player.allIn);
			const cardsDiv = playerDiv.querySelector('.cards');
			if (!player.inHand){
				cardsDiv.innerHTML=`<span class="card folded">X</span><span class="card folded">X</span>`;
			}
			else {
				cardsDiv.innerHTML = player.hand.map(card => `<span class="card ${card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'}">${card.rank}${card.suit}</span>`).join('');
			}
			playerDiv.innerHTML = `Player ${i + 1}<br>$${player.chips}${player.allIn ? ' (All-In)' : ''}<div class="cards">${cardsDiv.innerHTML}</div>`;
		}
	});
}//»
const updateCommunityCards=()=>{//«
//	const communityDiv = document.querySelector('.community-cards');
	commCardsElem.innerHTML = gameState.communityCards.map(card => `<span class="card ${card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'}">${card.rank}${card.suit}</span>`).join('');
}//»
const updatePot=()=>{//«
//	document.querySelector('.pot')
	potElem.textContent = `Pot: $${gameState.pot}`;
}//»
const stat=(message)=>{//«
//	document.querySelector('.status')
	statusElem.textContent = message;
	log(message);
}//»
const newGame=()=>{//«
	gameState = {
		num: gameState.num+1,
		players: [],
		communityCards: [],
		pot: 0,
		currentPlayer: 0,
		dealer: 0,
		phase: 'setup',
		currentBet: 0,
		deck: [],
	};

	setupElem.style.display = 'block';
	controlsElem.style.display = 'none';
	commCardsElem.innerHTML = '';
	potElem.textContent = 'Pot: $0';
	statusElem.textContent = '';
	tableElem.querySelectorAll('.player').forEach(el => el.remove());
	tableElem.querySelectorAll('.dealer-button').forEach(el => el.remove());
	betRingElem.querySelectorAll('.bet').forEach(el => el.remove());

}//»
const dealHands=()=>{//«
	for (let i = 0; i < 2; i++) {
		for (let player of gameState.players) {
			if (player.inHand) player.hand.push(dealCard());
		}
	}
}//»
const automatedAction=()=>{//«
	const player = gameState.players[gameState.currentPlayer];
	if (!player.inHand || player.allIn) {
		nextPlayer();
		return;
	}

	let action;
	switch (player.strategy) {
		case 'random':
			action = ['fold', 'call', 'raise', 'all-in'][Math.floor(Math.random() * 4)];
			break;
		case 'foldbot':
			action = 'fold';
			break;
		case 'expert':
			action = expertStrategy(player);
			break;
		default:
			action = 'call';
	}

	if (action === 'raise') {
		const raiseAmount = Math.min(gameState.currentBet * 2, player.chips + player.bet);
		if (raiseAmount === player.chips + player.bet) action = 'all-in';
		if (action === 'all-in') {
			player.allIn = true;
			player.bet += player.chips;
			gameState.pot += player.chips;
			player.chips = 0;
			gameState.currentBet = Math.max(gameState.currentBet, player.bet);
			stat(`Player ${player.id + 1} goes all-in with $${player.bet}`);
		} 
		else {
			player.chips -= raiseAmount - player.bet;
			gameState.pot += raiseAmount - player.bet;
			player.bet = raiseAmount;
			gameState.currentBet = raiseAmount;
			stat(`Player ${player.id + 1} raises to $${raiseAmount}`);
		}
	} 
	else if (action === 'call') {
		const callAmount = Math.min(gameState.currentBet - player.bet, player.chips);
		if (callAmount === player.chips) {
			player.allIn = true;
			player.bet += player.chips;
			gameState.pot += player.chips;
			player.chips = 0;
			stat(`Player ${player.id + 1} goes all-in to call $${player.bet}`);
		} 
		else {
			player.chips -= callAmount;
			gameState.pot += callAmount;
			player.bet = gameState.currentBet;
			stat(`Player ${player.id + 1} calls $${callAmount}`);
		}
	} 
	else if (action === 'all-in') {
		player.allIn = true;
		player.bet += player.chips;
		gameState.pot += player.chips;
		player.chips = 0;
		gameState.currentBet = Math.max(gameState.currentBet, player.bet);
		stat(`Player ${player.id + 1} goes all-in with $${player.bet}`);
	} 
	else {
		player.inHand = false;
		stat(`Player ${player.id + 1} folds`);
	}
	updatePlayerDisplay();
	updatePot();
	nextPlayer();
}//»
const expertStrategy=(player)=>{//«
	const handStrength = evaluateHand(player.hand, gameState.communityCards);
	if (handStrength > 0.7 && player.chips > 0) return 'raise';
	if (handStrength > 0.4 && player.chips > 0) return 'call';
	if (handStrength > 0.6 && player.chips === 0) return 'all-in';
	return 'fold';
}//»
const evaluateHand=(hand, community)=>{//«
	const allCards = [...hand, ...community];
	return Math.random();
}//»
const playerAction=(action)=>{//«
	const player = gameState.players[gameState.currentPlayer];
	if (!player.inHand || player.allIn) {
		nextPlayer();
		return;
	}
	if (action === 'raise') {
		const raiseAmount = Math.min(gameState.currentBet * 2, player.chips + player.bet);
		if (raiseAmount === player.chips + player.bet) {
			player.allIn = true;
			player.bet += player.chips;
			player.total += player.bet;
			gameState.pot += player.chips;
			player.chips = 0;
			gameState.currentBet = Math.max(gameState.currentBet, player.bet);
			stat(`Player ${player.id + 1} goes all-in with $${player.bet}`);
		} 
		else {
			player.chips -= raiseAmount - player.bet;
			gameState.pot += raiseAmount - player.bet;
			player.bet = raiseAmount;
			player.total += player.bet;
			gameState.currentBet = raiseAmount;
			stat(`Player ${player.id + 1} raises to $${raiseAmount}`);
		}
	}
	else if (action === 'call') {
		const callAmount = Math.min(gameState.currentBet - player.bet, player.chips);
		if (callAmount === player.chips) {
			player.allIn = true;
			player.bet += player.chips;
			player.total += player.bet;
			gameState.pot += player.chips;
			player.chips = 0;
			stat(`Player ${player.id + 1} goes all-in to call $${player.bet}`);
		} 
		else {
			player.chips -= callAmount;
			gameState.pot += callAmount;
			player.bet = gameState.currentBet;
			player.total += player.bet;
			stat(`Player ${player.id + 1} calls $${callAmount}`);
		}
	}
	else if (action === 'all-in') {
		player.allIn = true;
		player.bet += player.chips;
		player.total += player.bet;
		gameState.pot += player.chips;
		player.chips = 0;
		gameState.currentBet = Math.max(gameState.currentBet, player.bet);
		stat(`Player ${player.id + 1} goes all-in with $${player.bet}`);
	} 
	else {
		player.inHand = false;
		stat(`Player ${player.id + 1} folds`);
	}
	player.betDiv.innerHTML=`${player.total}`;
	controlsElem.style.display = 'none';
	updatePot();
	nextPlayer();
	updatePlayerDisplay();
}//»
const actionKey = k => {//«
	let a;
	if (k=="f") a = "fold";
	else if (k=="c") a = "call";
	else if (k=="r") a = "raise";
	else if (k=="a") a = "all-in";
	else return;
	playerAction(a);
};//»
const nextPlayer=()=>{//«
	let activePlayers = gameState.players.filter(p => p.inHand && !p.allIn).length;
	let playersInHand = gameState.players.filter(p => p.inHand).length;
	let allInCount = gameState.players.filter(p => p.allIn && p.inHand).length;

	if (playersInHand <= 1) {
		endHand();
		return;
	}

	let betsEqual = gameState.players.every(p => !p.inHand || p.allIn || p.bet === gameState.currentBet);

	// If one player is all-in and bets are unequal, allow the other to act
	if (allInCount > 0 && !betsEqual && activePlayers > 0) {
		gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
		while (!gameState.players[gameState.currentPlayer].inHand || gameState.players[gameState.currentPlayer].allIn) {
			gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
		}
		stat(`Player ${gameState.currentPlayer + 1}'s turn`);
		if (curType() !== 'live') {
			automatedAction();
		} 
		else {
			controlsElem.style.display = 'flex';
		}
		return;
	}

	// If bets are equal or all remaining players are all-in, proceed to next phase or end hand
	if (betsEqual || activePlayers === 0) {
		if (gameState.phase !== 'river') {
			nextPhase();
		} else {
			endHand();
		}
		return;
	}

	// Normal case: find next non-all-in, in-hand player
	gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
	let startPlayer = gameState.currentPlayer;
	let looped = false;
	while (!gameState.players[gameState.currentPlayer].inHand || gameState.players[gameState.currentPlayer].allIn) {
		gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
		if (gameState.currentPlayer === startPlayer) {
			looped = true;
			break;
		}
	}

	// If we looped without finding a valid player, bets must be settled
	if (looped) {
		if (gameState.phase !== 'river') {
			nextPhase();
		} else {
			endHand();
		}
		return;
	}

	stat(`Player ${gameState.currentPlayer + 1}'s turn`);
	updatePlayerDisplay();

	if (curType() !== 'live') {
		automatedAction();
	} 
	else {
		controlsElem.style.display = 'flex';
	}
}//»
const nextPhase=()=>{//«
	gameState.currentBet = 0;
	gameState.players.forEach(p => p.bet = 0);
	if (gameState.phase === 'preflop') {
		let b1 = dealCard();
		let b2 = dealCard();
		let b3 = dealCard();
		stat(`Flop: ${b1.rank}${b1.suit} ${b2.rank}${b2.suit} ${b3.rank}${b3.suit}`);
		gameState.communityCards = [b1, b2, b3];
		gameState.phase = 'flop';
	} 
	else if (gameState.phase === 'flop') {
		let b4 = dealCard();
		stat(`Turn: ${b4.rank}${b4.suit}`);
		gameState.communityCards.push(b4);
		gameState.phase = 'turn';
	} 
	else if (gameState.phase === 'turn') {
		let b5 = dealCard();
		stat(`River: ${b5.rank}${b5.suit}`);
		gameState.communityCards.push(b5);
		gameState.phase = 'river';
	} 
	else {
		endHand();
		return;
	}

	updateCommunityCards();
	gameState.currentPlayer = (gameState.dealer + 1) % gameState.players.length;
	let startPlayer = gameState.currentPlayer;
	let looped = false;
	while (!gameState.players[gameState.currentPlayer].inHand || gameState.players[gameState.currentPlayer].allIn) {
		gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
		if (gameState.currentPlayer === startPlayer) {
			looped = true;
			break;
		}
	}
	if (looped && gameState.players.filter(p => p.inHand).length > 1) {
		if (gameState.phase !== 'river') {
			nextPhase();
		} else {
			endHand();
		}
		return;
	}
	stat(`Player ${gameState.currentPlayer + 1}'s turn`);
	updatePlayerDisplay();
	if (curType() !== 'live') {
		automatedAction();
	} 
	else {
		controlsElem.style.display = 'flex';
	}
}//»
const endHand=()=>{//«
	const winner = gameState.players.find(p => p.inHand) || gameState.players[0];
	winner.chips += gameState.pot;
	stat(`Player ${winner.id + 1} wins $${gameState.pot}`);
	gameState.pot = 0;
	gameState.communityCards = [];
	gameState.players.forEach(p => {
		p.hand = [];
		p.inHand = true;
		p.bet = 0;
		p.allIn = false;
		p.betDiv.innerHTML="";
	});

	document.getElementById(`dealer-button-${gameState.dealer}`).style.display="";

	gameState.dealer = (gameState.dealer + 1) % gameState.players.length;
	gameState.phase = 'preflop';
	gameState.deck = [...deck];
	shuffle(gameState.deck);
	updateCommunityCards();
	updatePlayerDisplay();
	updatePot();
	gameState.num++;
	startGame();
}//»
const updateNumPlayers=()=>{//«
	const num = parseInt(numPlayersSelect.value);
	playerTypesDiv.innerHTML = '';
	for (let i = 0; i < num; i++) {
		const select = document.createElement('select');
		select.className = 'player-type';
		['live', 'random', 'foldbot', 'expert'].forEach(type => {
			const option = document.createElement('option');
			option.value = type;
			option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
			select.appendChild(option);
		});
		playerTypesDiv.appendChild(select);
		playerTypesDiv.appendChild(document.createElement('br'));
	}
};//»
const getPlayerTypes=()=>{//«
	playerTypes = Array.from(document.querySelectorAll('.player-type')).map(select => select.value);
	return playerTypes;
};//»
document.onkeydown=(e)=>{//«
let k = e.key;
if (k=="Escape"){
wrn("Game reset!");
	newGame();
	return;
}
if (gameState.phase==='setup'){
	if (k=="Enter") {
//Check for at least one live player...
if (!getPlayerTypes().includes("live")) {
wrn(`Must have at least one "live" player!`);
return;
}
		return startGame();
	}
	if (k.match(/^[2-9]$/)){
		numPlayersSelect.value = k;
		updateNumPlayers();
	}
	return;
}
if (controlsElem.style.display === "none" || gameState.players[gameState.currentPlayer].type !== 'live') return;
actionKey(k);

};//»

//Init«
for (let i = 2; i <= 10; i++) {
	const option = document.createElement('option');
	option.value = i;
	option.textContent = i;
	numPlayersSelect.appendChild(option);
}
numPlayersSelect.onchange = updateNumPlayers;
updateNumPlayers();
//»
