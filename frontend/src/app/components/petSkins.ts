import angry from "../../assets/pet-skins/angry.png";
import contempt from "../../assets/pet-skins/contempt.png";
import happy from "../../assets/pet-skins/happy.png";
import normal from "../../assets/pet-skins/normal.png";
import sad from "../../assets/pet-skins/sad.png";
import shy from "../../assets/pet-skins/shy.png";
import sleepy from "../../assets/pet-skins/sleepy.png";
import surprised from "../../assets/pet-skins/surprised.png";
import thinking from "../../assets/pet-skins/thinking.png";

export type PetSkinId =
  | "normal"
  | "happy"
  | "thinking"
  | "surprised"
  | "sleepy"
  | "angry"
  | "shy"
  | "sad"
  | "contempt";

export const petSkins: Record<PetSkinId, string> = {
  normal,
  happy,
  thinking,
  surprised,
  sleepy,
  angry,
  shy,
  sad,
  contempt,
};
