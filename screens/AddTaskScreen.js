import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { searchPlaceCandidates } from '../services/googleMaps';
import { colors } from '../theme/colors';

const taskTypeOptions = [
  { value: 'personal', label: '個人任務' },
  { value: 'group', label: '團隊任務' },
];

const locationModeOptions = [
  { value: 'flexible', label: '彈性地點' },
  { value: 'fixed', label: '固定地址' },
];

function OptionRow({ label, options, value, onChange }) {
  return (
    <View style={styles.optionSection}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.optionWrap}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.optionChip, selected && styles.optionChipSelected]}
              onPress={() => onChange(option.value)}
            >
              <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function PlaceResultCard({ place, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.placeCard, selected && styles.placeCardSelected]}
      activeOpacity={0.9}
      onPress={() => onPress(place)}
    >
      <Text style={styles.placeName}>{place.name}</Text>
      <Text style={styles.placeAddress}>{place.address}</Text>
    </TouchableOpacity>
  );
}

const defaultMapRegion = {
  latitude: 23.6978,
  longitude: 120.9605,
  latitudeDelta: 3.8,
  longitudeDelta: 3.8,
};

const buildMapRegion = (places, selectedPlace) => {
  const anchor = selectedPlace?.coordinates || places[0]?.coordinates;

  if (!anchor) return defaultMapRegion;

  return {
    latitude: anchor.latitude,
    longitude: anchor.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };
};

export default function AddTaskScreen({ groups, onAddTask }) {
  const availableGroups = useMemo(() => groups || [], [groups]);
  const [taskType, setTaskType] = useState('personal');
  const [title, setTitle] = useState('');
  const [locationMode, setLocationMode] = useState('flexible');
  const [locationInput, setLocationInput] = useState('');
  const [groupId, setGroupId] = useState(availableGroups[0]?.id || '');
  const [placeResults, setPlaceResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [searchError, setSearchError] = useState('');

  const resetPlaceSelection = () => {
    setPlaceResults([]);
    setSelectedPlace(null);
    setSearchError('');
  };

  const resetForm = () => {
    setTaskType('personal');
    setTitle('');
    setLocationMode('flexible');
    setLocationInput('');
    setGroupId(availableGroups[0]?.id || '');
    resetPlaceSelection();
  };

  const handleChangeLocationMode = (nextMode) => {
    setLocationMode(nextMode);
    resetPlaceSelection();
  };

  const handleChangeLocationInput = (value) => {
    setLocationInput(value);

    if (selectedPlace) {
      const matchesSelected =
        value.trim() === selectedPlace.name || value.trim() === selectedPlace.address;

      if (!matchesSelected) {
        setSelectedPlace(null);
      }
    }
  };

  const handleSearchPlaces = async () => {
    const query = locationInput.trim();

    if (query.length < 2) {
      Alert.alert('請輸入搜尋關鍵字', '請至少輸入兩個字，再搜尋固定地址或地點。');
      return;
    }

    setSearchingPlaces(true);
    setSearchError('');

    try {
      const candidates = await searchPlaceCandidates(query);
      setPlaceResults(candidates);

      if (candidates.length === 0) {
        setSelectedPlace(null);
        setSearchError('找不到符合條件的 Google 地點結果，請試試看更完整的名稱。');
      }
    } catch (error) {
      setPlaceResults([]);
      setSelectedPlace(null);
      setSearchError(error.message);
    } finally {
      setSearchingPlaces(false);
    }
  };

  const handleSelectPlace = (place) => {
    setSelectedPlace(place);
    setLocationInput(place.name);
    setSearchError('');
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('請填寫任務名稱', '任務名稱是必填欄位。');
      return;
    }

    if (!locationInput.trim()) {
      Alert.alert('請填寫任務地點', '任務地點是必填欄位。');
      return;
    }

    if (taskType === 'group' && !groupId) {
      Alert.alert('請選擇群組', '團隊任務需要指定一個群組。');
      return;
    }

    if (locationMode === 'fixed' && !selectedPlace) {
      Alert.alert('請先選擇固定地址', '固定地址任務需要先從搜尋結果或地圖上選定地點。');
      return;
    }

    const payload =
      locationMode === 'fixed'
        ? {
            title: title.trim(),
            location: selectedPlace.name,
            exactAddress: selectedPlace.address,
            coordinates: selectedPlace.coordinates,
            googlePlaceId: selectedPlace.placeId,
            locationMode,
            taskType,
            groupId: taskType === 'group' ? groupId : null,
          }
        : {
            title: title.trim(),
            location: locationInput.trim(),
            exactAddress: '',
            coordinates: null,
            googlePlaceId: '',
            locationMode,
            taskType,
            groupId: taskType === 'group' ? groupId : null,
          };

    onAddTask(payload);
    resetForm();

    Alert.alert(
      '任務建立成功',
      locationMode === 'fixed'
        ? '這筆任務已綁定固定地址，之後移動到別的城市，任務位置也不會改變。'
        : '這筆任務會在需要時依你的目前位置解析附近對應地點。'
    );
  };

  const mapRegion = buildMapRegion(placeResults, selectedPlace);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionTitle}>新增任務</Text>
      <Text style={styles.helpText}>
        你現在可以把任務地點分成兩種模式。一種是只記需求類型，像是全聯或便利商店；另一種是固定指定地址，像是成大資工系館或某間特定分店。
      </Text>

      <OptionRow label="任務類型" options={taskTypeOptions} value={taskType} onChange={setTaskType} />

      <Text style={styles.fieldLabel}>任務名稱</Text>
      <TextInput
        style={styles.input}
        placeholder="例如：買雞蛋、交報告、去取貨"
        value={title}
        onChangeText={setTitle}
        placeholderTextColor="#9da3b2"
      />

      <OptionRow
        label="地點模式"
        options={locationModeOptions}
        value={locationMode}
        onChange={handleChangeLocationMode}
      />

      <Text style={styles.fieldLabel}>
        {locationMode === 'fixed' ? '搜尋固定地址或地點' : '任務地點'}
      </Text>
      <TextInput
        style={styles.input}
        placeholder={
          locationMode === 'fixed'
            ? '例如：成大資工系館、7-ELEVEN 成大門市'
            : '例如：全聯、便利商店、五金行'
        }
        value={locationInput}
        onChangeText={handleChangeLocationInput}
        placeholderTextColor="#9da3b2"
        autoCorrect={false}
        autoCapitalize="none"
      />

      {locationMode === 'fixed' ? (
        <>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleSearchPlaces}>
            {searchingPlaces ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.secondaryButtonText}>搜尋 Google 地點結果</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.modeHint}>
            固定地址任務建立後，之後你移動到別的城市，這筆任務仍然會指向同一個地點。
          </Text>

          {selectedPlace ? (
            <View style={styles.selectedPlaceBox}>
              <Text style={styles.selectedPlaceTitle}>目前已選擇的地點</Text>
              <Text style={styles.selectedPlaceName}>{selectedPlace.name}</Text>
              <Text style={styles.selectedPlaceAddress}>{selectedPlace.address}</Text>
            </View>
          ) : null}

          {searchError ? <Text style={styles.errorText}>{searchError}</Text> : null}

          {placeResults.length > 0 ? (
            <>
              <Text style={styles.resultTitle}>地圖候選位置</Text>
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={mapRegion}
                  region={mapRegion}
                >
                  {placeResults.map((place) => {
                    if (!place.coordinates) return null;

                    const selected = selectedPlace?.placeId === place.placeId;

                    return (
                      <Marker
                        key={place.placeId}
                        coordinate={place.coordinates}
                        title={place.name}
                        description={place.address}
                        pinColor={selected ? colors.primary : colors.secondary}
                        onPress={() => handleSelectPlace(place)}
                      />
                    );
                  })}
                </MapView>
              </View>

              <View style={styles.resultSection}>
                <Text style={styles.resultTitle}>請點選一個 Google 地點結果</Text>
                {placeResults.map((place) => (
                  <PlaceResultCard
                    key={place.placeId}
                    place={place}
                    selected={selectedPlace?.placeId === place.placeId}
                    onPress={handleSelectPlace}
                  />
                ))}
              </View>
            </>
          ) : null}
        </>
      ) : (
        <Text style={styles.modeHint}>
          彈性地點代表先記需求類型，之後在附近任務頁會依照目前定位找對應的附近地點。
        </Text>
      )}

      {taskType === 'group' ? (
        <View style={styles.optionSection}>
          <Text style={styles.fieldLabel}>指定群組</Text>
          <View style={styles.optionWrap}>
            {availableGroups.map((group) => {
              const selected = group.id === groupId;

              return (
                <TouchableOpacity
                  key={group.id}
                  style={[styles.optionChip, selected && styles.optionChipSelected]}
                  onPress={() => setGroupId(group.id)}
                >
                  <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>
                    {group.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>建立任務</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 14,
    lineHeight: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  optionSection: {
    marginBottom: 14,
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  optionChipSelected: {
    backgroundColor: colors.secondarySoft,
    borderColor: colors.secondary,
  },
  optionChipText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  optionChipTextSelected: {
    color: colors.primary,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  modeHint: {
    marginTop: 10,
    marginBottom: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontSize: 13,
  },
  selectedPlaceBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  selectedPlaceTitle: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: 6,
    fontWeight: '700',
  },
  selectedPlaceName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  selectedPlaceAddress: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  mapContainer: {
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: colors.surfaceMuted,
  },
  map: {
    flex: 1,
  },
  resultSection: {
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  placeCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  placeName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  placeAddress: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  errorText: {
    color: colors.danger,
    marginBottom: 12,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 16,
  },
});
