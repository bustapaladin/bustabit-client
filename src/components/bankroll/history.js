import React, { PureComponent } from 'react'
import { Table, Col, Row } from 'react-bootstrap'
import engine   from '../../core/engine'
import refresher from '../../refresher'
import userInfo from '../../core/user-info'
import socket from '../../socket'
import { formatBalance } from '../../util/belt'

class BankrollHistory extends PureComponent {
	constructor() {
		super();
		this.init = this.init.bind(this);
		this.unmounted = false;
		this.state = {
			loading: true,
			error: null,
			history: []  // an object of { 	amount, created, id, offsite }
		}
	}

	componentWillMount() {
		this.init();
		socket.on('bankrollChanged', this.init);
	}

	componentWillUnmount() {
		socket.removeListener('bankrollChanged', this.init);
		this.unmounted = true;

	}

	init() {
		socket.send('getBankrollHistory')
			.then(history => {
				if (this.unmounted) return;
				console.log('Bankroll History: ',history);
				this.setState({ history, loading: false })
			})
			.catch(error => {
				console.error('Got an error from the server when requesting Bankroll History: ', error);
				if (this.unmounted) return;
				this.setState({ error, loading: false })
			});
	}

	results() {
		return this.state.history.map(d => {


			return <tr key={ d.id }>
				<td>{ d.created }</td>
				<td>{ formatBalance(d.preBankroll) } bits</td>
				<td>{ d.amount > 0 || d.offsite ? 'Added' : 'Removed' }</td>
				<td>{ formatBalance(d.amount) } bits</td>
				<td>{ formatBalance(d.offsite) } bits </td>
			</tr>
		});
	}

  render() {
    return (
      <Row>
        <Col sm={18} xs={12} style={{marginTop: '20px'}}>
          <h4 style={{ letterSpacing: '3px'}}>YOUR BANKROLL HISTORY</h4>
        </Col>
        <Col xs={24} style={{marginTop: '10px'}}>
          <Table striped bordered condensed hover responsive className="history-table">
            <thead className="table-header">
            <tr>
              <th>Time</th>
							<th>Bankroll At Time</th>
							<th>Operation</th>
              <th>Amount</th>
							<th>Offsite</th>
            </tr>
            </thead>
            <tbody>
						{ this.results() }
            </tbody>
          </Table>
        </Col>
      </Row>

    )
  }
}


export default refresher(BankrollHistory,
	[userInfo, 'BANKROLL_STATS_CHANGED', 'UNAME_CHANGED'],
	[engine, 'BANKROLL_CHANGED']
);