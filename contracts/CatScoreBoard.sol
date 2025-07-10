// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CatScoreBoard {
    mapping(address => uint256) public highScores;
    event ScoreSubmitted(address indexed player, uint256 score);

    function submitScore(uint256 score) external {
        if (score > highScores[msg.sender]) {
            highScores[msg.sender] = score;
            emit ScoreSubmitted(msg.sender, score);
        }
    }
}
