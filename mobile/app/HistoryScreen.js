import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomStatusBar from '../components/CustomStatusBar';

const HistoryScreen = () => {
  const { t } = useTranslation();
  const { COLORS, SHADOWS } = useAppContext();
  const [history, setHistory] = useState([]);

  const gradientColors = [COLORS.gradientStart, COLORS.gradientEnd];

  // Load history when component mounts
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading history:', error);
      }
    };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const confirmClearHistory = () => {
    Alert.alert(
      t('clearHistory'),
      t('clearHistoryConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('clear'), 
          onPress: clearHistory,
          style: 'destructive'
        }
      ]
    );
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem('history');
      setHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
      Alert.alert(t('error'), t('clearHistoryError'));
    }
  };

  const confirmDeleteItem = (id) => {
    Alert.alert(
      t('deleteItem'),
      t('deleteItemConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          onPress: () => deleteItem(id),
          style: 'destructive'
        }
      ]
    );
  };

  const deleteItem = async (id) => {
    try {
      const updatedHistory = history.filter(item => item.id !== id);
      await AsyncStorage.setItem('history', JSON.stringify(updatedHistory));
      setHistory(updatedHistory);
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert(t('error'), t('deleteItemError'));
    }
  };

  const renderHistoryItem = ({ item }) => {
    const result = item.result || {};
    const leaves = result.leaves || [];
    const leafCount = result.leaf_count || 0;
    const note = result.note;
    const date = result.date;

    return (
      <View style={[styles.card, { backgroundColor: COLORS.cardBg, ...SHADOWS.card }]}>
        {/* Delete Button */}
      <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => confirmDeleteItem(item.id)}
        >
          <Ionicons name="trash-outline" size={24} color={COLORS.danger} />
        </TouchableOpacity>

        {/* Image */}
        <Image 
          source={{ uri: item.processedImage ? `data:image/jpeg;base64,${item.processedImage}` : item.imageUri }} 
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Results */}
        <View style={styles.resultsContainer}>
          {/* Date */}
          <Text style={[styles.date, { color: COLORS.secondaryText }]}>
            {date ? formatDate(date) : t('unknownDate')}
          </Text>

          {/* Leaf Count */}
          <Text style={[styles.leafCount, { color: COLORS.accentGreen }]}>
            {leafCount} {t('leavesDetected')}
          </Text>
          
          {/* Each Leaf */}
          {leaves.map((leaf, index) => (
            <View key={index} style={styles.leafItem}>
              <Text style={[styles.leafText, { color: COLORS.text }]}>
                {t('leaf')} {index + 1}: {leaf.class_name} ({leaf.confidence}%)
            </Text>
          </View>
          ))}

          {/* Note */}
          {note && (
            <Text style={[styles.note, { color: COLORS.text }]}>
              {note}
            </Text>
          )}
        </View>
      </View>
    );
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
        <SafeAreaView style={styles.container}>
          {/* Clear History Button */}
          {history.length > 0 && (
            <View style={styles.clearButtonContainer}>
        <TouchableOpacity 
                style={[styles.clearButton, { backgroundColor: COLORS.accentBlue }]}
                onPress={confirmClearHistory}
        >
                <Ionicons name="trash-outline" size={24} color="white" style={styles.buttonIcon} />
                <Text style={styles.clearButtonText}>{t('clearHistory')}</Text>
        </TouchableOpacity>
      </View>
          )}

      <FlatList
        data={history}
            renderItem={renderHistoryItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
    </SafeAreaView>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  clearButtonContainer: {
    padding: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    backgroundColor: 'white',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  image: {
    width: '100%',
    height: 240,
  },
  resultsContainer: {
    padding: 24,
  },
  date: {
    fontSize: 15,
    marginBottom: 16,
    opacity: 0.6,
    fontWeight: '500',
  },
  leafCount: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  leafItem: {
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  leafText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  note: {
    fontSize: 16,
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 30,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
});

export default HistoryScreen;