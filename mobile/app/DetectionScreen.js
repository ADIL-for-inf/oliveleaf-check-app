import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  Linking 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';
import CustomStatusBar from '../components/CustomStatusBar';

const DetectionScreen = () => {
  const { t } = useTranslation();
  const { settings, COLORS, SHADOWS } = useAppContext();
  const navigation = useNavigation();

  const [image, setImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Load saved state when component mounts
  useEffect(() => {
    loadSavedState();
  }, []);

  // Save state when it changes
  useEffect(() => {
    if (image || analysisResult) {
      saveState();
    }
  }, [image, analysisResult]);

  const loadSavedState = async () => {
    try {
      const savedState = await AsyncStorage.getItem('detectionState');
      if (savedState) {
        const { savedImage, savedResult } = JSON.parse(savedState);
        if (savedImage) setImage(savedImage);
        if (savedResult) setAnalysisResult(savedResult);
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
  };

  const saveState = async () => {
    try {
      const stateToSave = {
        savedImage: image,
        savedResult: analysisResult
      };
      await AsyncStorage.setItem('detectionState', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  };

  // Utilise l'IP du serveur depuis les paramètres
  const API_URL = `http://${settings.serverIp}/detect`;

  // Gradient selon mode clair/sombre
  const gradientColors = settings.darkMode
    ? ['#121212', '#1e1e1e', '#121212']
    : ['#3498db', '#4ECDC4', '#2ecc71'];

  // Dictionnaire des traitements et recommandations
  const diseaseTreatments = {
    "Mouche de olivier": {
      treatment: t('diseaseTreatments.oliveFly.treatment'),
      recommendations: t('diseaseTreatments.oliveFly.recommendations', { returnObjects: true })
    },
    "Tuberculose": {
      treatment: t('diseaseTreatments.tuberculosis.treatment'),
      recommendations: t('diseaseTreatments.tuberculosis.recommendations', { returnObjects: true })
    },
    "cochenille noire": {
      treatment: t('diseaseTreatments.blackScale.treatment'),
      recommendations: t('diseaseTreatments.blackScale.recommendations', { returnObjects: true })
    },
    "en bonne etat": {
      treatment: t('diseaseTreatments.healthy.treatment'),
      recommendations: t('diseaseTreatments.healthy.recommendations', { returnObjects: true })
    },
    "oeil_de_paon": {
      treatment: t('diseaseTreatments.peacockEye.treatment'),
      recommendations: t('diseaseTreatments.peacockEye.recommendations', { returnObjects: true })
    },
    "psylle": {
      treatment: t('diseaseTreatments.psyllid.treatment'),
      recommendations: t('diseaseTreatments.psyllid.recommendations', { returnObjects: true })
    },
    "default": {
      treatment: t('diseaseTreatments.default.treatment'),
      recommendations: t('diseaseTreatments.default.recommendations', { returnObjects: true })
    },
    "noDetection": {
      treatment: t('noDetection.treatment'),
      recommendations: t('noDetection.recommendations', { returnObjects: true })
    }
  };

  /**
   * Permet à l'utilisateur de choisir une image depuis la galerie ou prendre une photo.
   * @param {'camera'|'gallery'} source
   */
  const pickImage = async (source) => {
    try {
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
        allowsEditing: true,
        aspect: [4, 3],
      };

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            t('permissionRequired'),
            t('cameraPermissionMessage'),
            [
              { text: t('cancel') },
              { text: t('settings'), onPress: () => Linking.openSettings() }
            ]
          );
          return;
        }
        const result = await ImagePicker.launchCameraAsync(options);
        handleImageResult(result);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            t('permissionRequired'),
            t('galleryPermissionMessage'),
            [
              { text: t('cancel') },
              { text: t('settings'), onPress: () => Linking.openSettings() }
            ]
          );
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync(options);
        handleImageResult(result);
      }
    } catch (error) {
      console.error(t('imageSelectionError'), error);
      Alert.alert(t('error'), t('imageSelectionErrorMessage'));
    }
  };

  /**
   * Traite le résultat de la sélection d'image.
   * @param {object} result
   */
  const handleImageResult = (result) => {
    if (!result.canceled && result.assets?.[0]?.uri) {
      setImage(result.assets[0].uri);
      setAnalysisResult(null); // Reset analysis when new image is selected
    }
  };

  /**
   * Envoie l'image au serveur Flask pour analyse.
   */
  const analyzeImage = async () => {
    if (!image) {
      Alert.alert(t('error'), t('selectImageError'));
      return;
    }

    // Vérifie que l'adresse IP est configurée
    if (!settings.serverIp || settings.serverIp.length < 7) {
      Alert.alert(
        t('serverNotConfigured'),
        t('serverNotConfiguredMessage'),
        [
          { text: t('cancel') },
          { 
            text: t('configure'), 
            onPress: () => navigation.navigate('Paramètres')
          }
        ]
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', {
        uri: image,
        name: 'image.jpg',
        type: 'image/jpeg'
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`http://${settings.serverIp}/detect`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${t('serverError')}: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Server Response:', JSON.stringify(result, null, 2));

      // Cas où aucune détection n'est renvoyée
      if (!result.detection_info || result.detection_info.leaf_count === 0) {
        Alert.alert(t('noDetection.title'), t('noDetection.message'));
        setAnalysisResult({
          processedImage: result.image,
          detectionInfo: result.detection_info
        });
        return;
      }

      const analysisResult = {
        processedImage: result.image,
        detectionInfo: result.detection_info
      };
      console.log('Setting Analysis Result:', JSON.stringify(analysisResult, null, 2));
      setAnalysisResult(analysisResult);
    } catch (error) {
      console.error(t('analysisError'), error);
      let errorMessage = t('analysisFailed');
      if (error.name === 'AbortError') {
        errorMessage = t('timeoutError');
      } else if (error.message.includes('Network request failed')) {
        errorMessage = t('serverConnectionError');
      } else if (error.message.includes(t('serverError'))) {
        errorMessage = t('serverErrorMessage');
      }
      Alert.alert(t('error'), errorMessage);
    }
  };

  /**
   * Sauvegarde le résultat dans l'historique local (AsyncStorage).
   */
  const saveToHistory = async () => {
    if (!image || !analysisResult) {
      Alert.alert(t('information'), t('noAnalysisToSave'));
      return;
    }

    try {
      // Save exactly what's shown on the screen
      const historyItem = {
        id: Date.now(),
        imageUri: image,
        processedImage: analysisResult.processedImage,
        result: {
          date: new Date().toISOString(),
          leaf_count: analysisResult.detectionInfo.leaf_count,
          note: analysisResult.detectionInfo.note,
          leaves: analysisResult.detectionInfo.leaves.map((leaf, index) => ({
            leaf_number: index + 1,
            class_name: leaf.class_name,
            confidence: leaf.confidence
          }))
        }
      };

      const history = JSON.parse(await AsyncStorage.getItem('history') || '[]');
      history.unshift(historyItem);
      await AsyncStorage.setItem('history', JSON.stringify(history));
      
      Alert.alert(
        t('success'),
        t('analysisSaved'),
        [
          { text: t('viewHistory'), onPress: () => navigation.navigate('HistoryScreen') },
          { text: t('continue'), style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error(t('saveError'), error);
      Alert.alert(t('error'), t('saveErrorMessage'));
    }
  };

  /**
   * Détermine la couleur du badge de sévérité.
   * @param {number} severity
   */
  const getSeverityColor = (severity) => {
    if (severity > 75) return COLORS.accentRed;
    if (severity > 40) return COLORS.accentYellow;
    return COLORS.accentGreen;
  };

  return (
    <>
      <CustomStatusBar />
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: COLORS.text }]}>{t('diagnosticTitle')}</Text>
            <Text style={[styles.subtitle, { color: COLORS.secondaryText }]}>{t('diagnosticSubtitle')}</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={() => pickImage('camera')}
              style={[styles.captureButton, { backgroundColor: COLORS.accentBlue }]}
            >
              <Ionicons name="camera" size={24} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>{t('takePhoto')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => pickImage('gallery')}
              style={[styles.galleryButton, { backgroundColor: COLORS.accentGreen }]}
            >
              <Ionicons name="images" size={24} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>{t('chooseImage')}</Text>
            </TouchableOpacity>
          </View>

          {image && (
            <View style={styles.imageSection}>
              <View style={[styles.imageContainer, { backgroundColor: COLORS.cardBg, ...SHADOWS.card }]}>
                {!analysisResult ? (
                <Image
                  source={{ uri: image }}
                  style={styles.image}
                  resizeMode="cover"
                />
                ) : (
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${analysisResult.processedImage}` }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                )}
              </View>

              {!analysisResult ? (
                <TouchableOpacity
                  onPress={analyzeImage}
                  style={[styles.analyzeButton, { backgroundColor: COLORS.accentBlue }]}
                >
                  <Ionicons name="analytics" size={24} color="white" style={styles.buttonIcon} />
                  <Text style={styles.analyzeButtonText}>{t('startAnalysis')}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.resultsContainer}>
                  {/* Detection Results */}
                  <View style={[styles.resultCard, { backgroundColor: COLORS.cardBg, ...SHADOWS.card }]}>
                    <View style={styles.resultHeader}>
                      <Ionicons name="leaf" size={24} color={COLORS.accentGreen} />
                      <Text style={[styles.resultTitle, { color: COLORS.text }]}>{t('analysisResults')}</Text>
                    </View>
                    
                    <View style={styles.resultContent}>
                      <View style={styles.resultItem}>
                        <View style={styles.resultLabelContainer}>
                          <Ionicons name="list" size={20} color={COLORS.accentBlue} />
                          <Text style={[styles.resultLabel, { color: COLORS.secondaryText }]}>{t('leafCount')}</Text>
                        </View>
                        <View style={[styles.resultValueContainer, { backgroundColor: COLORS.accentBlue + '20' }]}>
                          <Text style={[styles.resultValue, { color: COLORS.accentBlue }]}>{analysisResult.detectionInfo.leaf_count}</Text>
                            </View>
                      </View>

                      {analysisResult.detectionInfo.leaves.map((leaf, index) => (
                        <View key={index} style={styles.resultItem}>
                          <View style={styles.resultLabelContainer}>
                            <Ionicons name="leaf-outline" size={20} color={COLORS.accentGreen} />
                            <Text style={[styles.resultLabel, { color: COLORS.secondaryText }]}>
                              {t('leaf')} {index + 1}
                            </Text>
                      </View>
                          <View style={[styles.resultValueContainer, { backgroundColor: COLORS.accentGreen + '20' }]}>
                            <Text style={[styles.resultValue, { color: COLORS.accentGreen }]}>
                              {leaf.class_name} ({leaf.confidence}%)
                            </Text>
                          </View>
                          </View>
                        ))}
                    </View>
                      </View>

                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          onPress={() => {
                            setImage(null);
                            setAnalysisResult(null);
                          }}
                      style={[styles.actionButton, { backgroundColor: COLORS.accentBlue }]}
                        >
                      <Ionicons name="refresh" size={20} color="white" style={styles.buttonIcon} />
                          <Text style={styles.actionButtonText}>{t('newAnalysis')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={saveToHistory}
                      style={[styles.actionButton, { backgroundColor: COLORS.accentGreen }]}
                        >
                      <Ionicons name="save" size={20} color="white" style={styles.buttonIcon} />
                          <Text style={styles.actionButtonText}>{t('save')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
              )}
            </View>
          )}

          {!image && (
            <View style={styles.placeholderContainer}>
              <Ionicons name="leaf-outline" size={80} color={COLORS.placeholderText} />
              <Text style={[styles.placeholderText, { color: COLORS.placeholderText }]}>
                {t('placeholderText')}
              </Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '90%',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    gap: 15,
  },
  captureButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  galleryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  imageSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    aspectRatio: 4 / 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  resultsContainer: {
    marginTop: 20,
    width: '100%',
  },
  resultCard: {
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 10,
  },
  resultContent: {
    gap: 15,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultLabel: {
    fontSize: 15,
    marginLeft: 8,
    fontWeight: '500',
  },
  resultValueContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 10,
  },
  resultValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderContainer: {
    marginTop: 40,
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '80%',
  }
});

export default DetectionScreen;