import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View, Text } from 'react-native';
import { colors, fontStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import { connect } from 'react-redux';
import ActionView from '../ActionView';
import { renderFromTokenMinimalUnit } from '../../../util/number';
import TokenImage from '../../UI/TokenImage';
import Device from '../../../util/device';
import Engine from '../../../core/Engine';
import URL from 'url-parse';
import AnalyticsV2 from '../../../util/analyticsV2';

const styles = StyleSheet.create({
	root: {
		backgroundColor: colors.white,
		borderTopLeftRadius: 10,
		borderTopRightRadius: 10,
		paddingBottom: Device.isIphoneX() ? 20 : 0,
		minHeight: Device.isIos() ? '50%' : '60%'
	},
	title: {
		textAlign: 'center',
		fontSize: 18,
		marginVertical: 12,
		marginHorizontal: 20,
		color: colors.fontPrimary,
		...fontStyles.bold
	},
	text: {
		...fontStyles.normal,
		fontSize: 16,
		paddingTop: 25,
		paddingHorizontal: 10
	},
	tokenInformation: {
		flexDirection: 'row',
		marginHorizontal: 40,
		flex: 1,
		alignItems: 'flex-start',
		marginVertical: 30
	},
	tokenInfo: {
		flex: 1,
		flexDirection: 'column'
	},
	infoTitleWrapper: {
		alignItems: 'center'
	},
	infoTitle: {
		...fontStyles.bold
	},
	infoBalance: {
		alignItems: 'center'
	},
	infoToken: {
		alignItems: 'center'
	},
	token: {
		flexDirection: 'row'
	},
	identicon: {
		paddingVertical: 10
	},
	signText: {
		...fontStyles.normal,
		fontSize: 16
	},
	addMessage: {
		flexDirection: 'row',
		margin: 20
	},
	children: {
		alignItems: 'center',
		borderTopColor: colors.grey200,
		borderTopWidth: 1
	}
});

/**
 * PureComponent that renders watch asset content
 */
class WatchAssetRequest extends PureComponent {
	static propTypes = {
		/**
		 * Callback triggered when this message signature is rejected
		 */
		onCancel: PropTypes.func,
		/**
		 * Callback triggered when this message signature is approved
		 */
		onConfirm: PropTypes.func,
		/**
		 * Token object
		 */
		suggestedAssetMeta: PropTypes.object,
		/**
		 * Object containing token balances in the format address => balance
		 */
		contractBalances: PropTypes.object,
		/**
		 * Object containing current page title, url, and icon href
		 */
		currentPageInformation: PropTypes.object
	};

	getAnalyticsParams = () => {
		try {
			const {
				suggestedAssetMeta: { asset },
				currentPageInformation
			} = this.props;

			const { NetworkController } = Engine.context;
			const { chainId, type } = NetworkController?.state?.provider || {};

			const url = new URL(currentPageInformation?.url);
			return {
				token_address: asset?.address,
				token_symbol: asset?.symbol,
				dapp_host_name: url?.host,
				dapp_url: currentPageInformation?.url,
				network_name: type,
				chain_id: chainId,
				source: 'Dapp suggested (watchAsset)'
			};
		} catch (error) {
			return {};
		}
	};

	componentWillUnmount = async () => {
		const { TokensController } = Engine.context;
		const { suggestedAssetMeta } = this.props;
		await TokensController.rejectWatchAsset(suggestedAssetMeta.id);
	};

	onConfirm = async () => {
		const { onConfirm, suggestedAssetMeta } = this.props;
		const { TokensController } = Engine.context;
		await TokensController.acceptWatchAsset(suggestedAssetMeta.id);
		AnalyticsV2.trackEvent(AnalyticsV2.ANALYTICS_EVENTS.TOKEN_ADDED, this.getAnalyticsParams());
		onConfirm && onConfirm();
	};

	render() {
		const {
			suggestedAssetMeta: { asset },
			contractBalances
		} = this.props;
		const balance =
			asset.address in contractBalances
				? renderFromTokenMinimalUnit(contractBalances[asset.address], asset.decimals)
				: '0';
		return (
			<View style={styles.root}>
				<View style={styles.titleWrapper}>
					<Text style={styles.title} onPress={this.cancelSignature}>
						{strings('watch_asset_request.title')}
					</Text>
				</View>
				<ActionView
					cancelTestID={'request-signature-cancel-button'}
					confirmTestID={'request-signature-confirm-button'}
					cancelText={strings('watch_asset_request.cancel')}
					confirmText={strings('watch_asset_request.add')}
					onCancelPress={this.props.onCancel}
					onConfirmPress={this.onConfirm}
				>
					<View style={styles.children}>
						<View style={styles.addMessage}>
							<Text style={styles.signText}>{strings('watch_asset_request.message')}</Text>
						</View>

						<View style={styles.tokenInformation}>
							<View style={styles.tokenInfo}>
								<View style={styles.infoTitleWrapper}>
									<Text style={styles.infoTitle}>{strings('watch_asset_request.token')}</Text>
								</View>

								<View style={styles.infoToken}>
									<View style={styles.token}>
										<View style={styles.identicon}>
											<TokenImage
												asset={{
													...asset,
													logo: asset.image
												}}
												logoDefined
											/>
										</View>
										<Text style={styles.text}>{asset.symbol}</Text>
									</View>
								</View>
							</View>

							<View style={styles.tokenInfo}>
								<View style={styles.infoTitleWrapper}>
									<Text style={styles.infoTitle}>{strings('watch_asset_request.balance')}</Text>
								</View>

								<View style={styles.infoBalance}>
									<Text style={styles.text}>
										{balance} {asset.symbol}
									</Text>
								</View>
							</View>
						</View>
					</View>
				</ActionView>
			</View>
		);
	}
}

const mapStateToProps = state => ({
	contractBalances: state.engine.backgroundState.TokenBalancesController.contractBalances
});

export default connect(mapStateToProps)(WatchAssetRequest);
