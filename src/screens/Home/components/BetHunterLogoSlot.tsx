import React from "react";
import { StyleSheet, View } from "react-native";

interface BetHunterLogoSlotProps {
  size: number;
}

/**
 * Ícone do card "Minha Conta" — o logo do BetHunter.
 *
 * TODO(asset): PONTO DE INTEGRAÇÃO DO LOGO. Este componente é só um
 * placeholder com o tamanho certo para o layout. Para usar a arte final,
 * substitua o <View> abaixo pelo asset, por exemplo:
 *
 *   import BetHunterLogo from "../../../assets/home/bethunter.svg";
 *   return <BetHunterLogo width={size} height={size} />;
 */
const BetHunterLogoSlot: React.FC<BetHunterLogoSlotProps> = ({ size }) => (
  <View
    style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}
    accessibilityLabel="Logo BetHunter"
  />
);

const styles = StyleSheet.create({
  placeholder: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(224,112,133,0.8)",
    backgroundColor: "rgba(222,87,223,0.12)",
  },
});

export default BetHunterLogoSlot;
