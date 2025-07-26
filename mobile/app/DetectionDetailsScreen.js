import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

const DetectionDetailsScreen = ({ route }) => {
  const { t } = useTranslation();
  const { settings, COLORS, SHADOWS } = useAppContext();
  const { item } = route.params;

  return (
    <ScrollView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.imageUri }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <View style={[styles.detailsContainer, { backgroundColor: COLORS.cardBg, ...SHADOWS.card }]}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="leaf" size={24} color={COLORS.accentGreen} />
            <Text style={[styles.sectionTitle, { color: COLORS.text }]}>
              {t('detectionDetails')}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={[styles.label, { color: COLORS.secondaryText }]}>
              {t('disease')}
            </Text>
            <Text style={[styles.value, { color: COLORS.text }]}>
              {item.result.maladie}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={[styles.label, { color: COLORS.secondaryText }]}>
              {t('confidence')}
            </Text>
            <Text style={[styles.value, { color: COLORS.accentBlue }]}>
              {item.result.probabilite}%
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={[styles.label, { color: COLORS.secondaryText }]}>
              {t('date')}
            </Text>
            <Text style={[styles.value, { color: COLORS.text }]}>
              {new Date(item.result.date).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={[styles.label, { color: COLORS.secondaryText }]}>
              {t('leafCount')}
            </Text>
            <Text style={[styles.value, { color: COLORS.text }]}>
              {item.result.leaf_count}
            </Text>
          </View>
        </View>

        {item.result.leaves && item.result.leaves.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list" size={24} color={COLORS.accentBlue} />
              <Text style={[styles.sectionTitle, { color: COLORS.text }]}>
                {t('detectedLeaves')}
              </Text>
            </View>

            {item.result.leaves.map((leaf, index) => (
              <View key={index} style={styles.leafItem}>
                <Text style={[styles.leafTitle, { color: COLORS.text }]}>
                  {t('leaf')} {index + 1}
                </Text>
                <View style={styles.leafDetails}>
                  <Text style={[styles.leafValue, { color: COLORS.accentGreen }]}>
                    {leaf.class_name}
                  </Text>
                  <Text style={[styles.leafConfidence, { color: COLORS.accentBlue }]}>
                    {leaf.confidence}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {item.result.note && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={24} color={COLORS.accentBlue} />
              <Text style={[styles.sectionTitle, { color: COLORS.text }]}>
                {t('note')}
              </Text>
            </View>
            <Text style={[styles.noteText, { color: COLORS.text }]}>
              {item.result.note}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
  detailItem: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  leafItem: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  leafTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  leafDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leafValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  leafConfidence: {
    fontSize: 14,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 15,
    lineHeight: 22,
  },
});

export default DetectionDetailsScreen; 